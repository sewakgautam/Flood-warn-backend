import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

const DHM_REALTIME = 'https://dhm.gov.np/hydrology/realtime-stream';
const DHM_RAINFALL_MAP = 'https://dhm.gov.np/hydrology/rainfall-watch-map';
const DHM_RAINFALL_API = 'https://dhm.gov.np/hydrology/getRainfallFilter';

@Injectable()
export class NepalSyncService implements OnApplicationBootstrap {
  private readonly logger = new Logger(NepalSyncService.name);

  constructor(private prisma: PrismaService) {}

  async onApplicationBootstrap() {
    await this.runSync();
  }

  @Interval(30 * 60 * 1000)
  async runSync() {
    this.logger.log(`Sync cycle — ${new Date().toISOString()}`);
    try {
      // Build a rainfall map keyed by DHM station id for fast lookup
      const rainfallMap = await this.fetchRainfallMap();
      this.logger.log(`Rainfall map has ${rainfallMap.size} entries`);

      const stations = await this.fetchStations();
      this.logger.log(`Found ${stations.length} river stations`);

      let saved = 0;
      for (const s of stations) {
        try {
          const rainfall = rainfallMap.get(s.dhmId) ?? null;
          await this.saveStation(s, rainfall);
          saved++;
        } catch (e) {
          this.logger.error(`Skip ${s.name}:`, (e as Error).message);
        }
      }

      this.logger.log(`Sync complete — saved ${saved}/${stations.length}`);
    } catch (err) {
      this.logger.error('Sync failed:', (err as Error).message);
    }
  }

  /**
   * Fetch rainfall data and return a Map<dhmId, valueMm>.
   * Tries the realtime-stream page first (embeds rainfall per station),
   * then falls back to the separate getRainfallFilter POST API.
   */
  private async fetchRainfallMap(): Promise<Map<string, number>> {
    // ── Attempt 1: realtime-stream (all data in one page) ──────────────────────
    try {
      const res = await fetch(DHM_REALTIME, {
        signal: AbortSignal.timeout(20000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();

      // Try every likely variable name that might carry station data
      const match =
        html.match(/var\s+coordinates\s*=\s*(\[[\s\S]*?\]);/) ??
        html.match(/var\s+stations\s*=\s*(\[[\s\S]*?\]);/) ??
        html.match(/var\s+stationData\s*=\s*(\[[\s\S]*?\]);/) ??
        html.match(/var\s+data\s*=\s*(\[[\s\S]*?\]);/);

      if (match) {
        const raw: any[] = JSON.parse(match[1]);
        this.logger.log(`realtime-stream: ${raw.length} entries`);
        if (raw.length > 0) {
          this.logger.log(`Sample keys: ${Object.keys(raw[0]).join(', ')}`);
        }

        const map = new Map<string, number>();
        for (const s of raw) {
          const id = String(s.id ?? s.station_id ?? '');
          if (!id) continue;
          // Try common rainfall field names
          const mm =
            s.rainfall ?? s.rainfall_value ?? s.rainfall_6h ??
            s.rain ?? s.rain_value ?? s.precipitation ??
            s.rainFall ?? s.rainfallValue ?? null;
          if (mm != null && parseFloat(mm) >= 0) {
            map.set(id, parseFloat(mm));
          }
        }
        if (map.size > 0) {
          this.logger.log(`realtime-stream rainfall map: ${map.size} entries`);
          return map;
        }
        this.logger.log('realtime-stream had no rainfall fields — falling back to getRainfallFilter');
      } else {
        this.logger.warn('realtime-stream: no recognisable data array found');
      }
    } catch (err) {
      this.logger.warn('realtime-stream fetch failed:', (err as Error).message);
    }

    // ── Attempt 2: separate rainfall POST API ──────────────────────────────────
    return this.fetchRainfallFromApi();
  }

  private async fetchRainfallFromApi(): Promise<Map<string, number>> {
    try {
      const pageRes = await fetch(DHM_RAINFALL_MAP, {
        signal: AbortSignal.timeout(20000),
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' },
      });
      if (!pageRes.ok) throw new Error(`HTTP ${pageRes.status}`);
      const html = await pageRes.text();
      const csrfMatch = html.match(/name="csrf_test_name"\s+value="(\w+)"/);
      const csrf = csrfMatch?.[1] ?? '';
      const cookies = pageRes.headers.get('set-cookie') ?? '';

      const formData = new URLSearchParams({ csrf_test_name: csrf, hour: '6' });
      const apiRes = await fetch(DHM_RAINFALL_API, {
        method: 'POST',
        signal: AbortSignal.timeout(20000),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': DHM_RAINFALL_MAP,
          'Cookie': cookies,
          'User-Agent': 'Mozilla/5.0',
        },
        body: formData.toString(),
      });
      if (!apiRes.ok) throw new Error(`Rainfall API HTTP ${apiRes.status}`);
      const json = await apiRes.json();

      const arr: any[] = Array.isArray(json) ? json
        : Array.isArray(json?.data) ? json.data
        : Object.values(json?.data ?? {}).flat() as any[];

      this.logger.log(`getRainfallFilter: ${arr.length} entries`);
      if (arr.length > 0) {
        this.logger.log(`Rainfall sample keys: ${Object.keys(arr[0]).join(', ')}`);
      }

      // Build id→mm map; also try matching by station name later if IDs don't line up
      const map = new Map<string, number>();
      for (const s of arr) {
        const id = String(s.id ?? s.station_id ?? '');
        if (!id) continue;
        const mm = s.value ?? s.rainfall ?? s.rain ?? null;
        if (mm != null && parseFloat(mm) >= 0) {
          map.set(id, parseFloat(mm));
        }
      }
      this.logger.log(`Rainfall map built: ${map.size} entries`);
      return map;
    } catch (err) {
      this.logger.warn('getRainfallFilter fetch failed:', (err as Error).message);
      return new Map();
    }
  }

  private async fetchStations() {
    const res = await fetch(DHM_REALTIME, {
      signal: AbortSignal.timeout(20000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    const match =
      html.match(/var\s+coordinates\s*=\s*(\[[\s\S]*?\]);/) ??
      html.match(/var\s+stations\s*=\s*(\[[\s\S]*?\]);/) ??
      html.match(/var\s+stationData\s*=\s*(\[[\s\S]*?\]);/) ??
      html.match(/var\s+data\s*=\s*(\[[\s\S]*?\]);/);

    if (!match) throw new Error('No station data array found in realtime-stream HTML');

    const raw: any[] = JSON.parse(match[1]);
    this.logger.log(`Parsed ${raw.length} stations from realtime-stream`);

    return raw
      .filter(s => s.id && s.name)
      .map(s => ({
        dhmId: String(s.id),
        name: s.name.trim(),
        basin: s.basin || '',
        district: s.district || '',
        lat: s.latitude != null ? parseFloat(s.latitude) : null,
        lon: s.longitude != null ? parseFloat(s.longitude) : null,
        waterLevel: s.waterLevel?.value != null ? parseFloat(s.waterLevel.value) : null,
        warningLevel: s.warning_level ? parseFloat(s.warning_level) : null,
        dangerLevel: s.danger_level ? parseFloat(s.danger_level) : null,
        // grab rainfall if embedded directly in this page
        rainfallMm: (() => {
          const mm = s.rainfall ?? s.rainfall_value ?? s.rainfall_6h ?? s.rain ?? null;
          return mm != null && parseFloat(mm) >= 0 ? parseFloat(mm) : null;
        })(),
      }));
  }

  private async saveStation(
    { dhmId, name, basin, district, lat, lon, waterLevel, warningLevel, dangerLevel, rainfallMm }: {
      dhmId: string; name: string; basin: string; district: string;
      lat: number | null; lon: number | null;
      waterLevel: number | null; warningLevel: number | null; dangerLevel: number | null;
      rainfallMm: number | null;
    },
    rainfallFromMap: number | null,
  ) {
    const stationId = `DHM-${dhmId}`;
    const location = [basin ? `${basin} Basin` : '', district, 'Nepal'].filter(Boolean).join(', ');

    await this.prisma.station.upsert({
      where: { id: stationId },
      create: { id: stationId, name, location, latitude: lat, longitude: lon, status: 'ONLINE', lastSeenAt: new Date() },
      update: { name, location, status: 'ONLINE', lastSeenAt: new Date(), latitude: lat, longitude: lon },
    });

    await this.prisma.stationThreshold.upsert({
      where: { stationId },
      create: {
        stationId,
        ...(warningLevel ? { warningRiver: warningLevel } : {}),
        ...(dangerLevel ? { criticalRiver: dangerLevel } : {}),
      },
      update: {
        ...(warningLevel ? { warningRiver: warningLevel } : {}),
        ...(dangerLevel ? { criticalRiver: dangerLevel } : {}),
      },
    });

    const now = new Date();

    if (waterLevel != null && waterLevel > 0 && waterLevel < 9000) {
      await this.prisma.riverLevel.create({
        data: { stationId, timestamp: now, levelM: waterLevel, flowRateCms: null },
      });
    }

    // Use rainfall embedded in page, or fall back to value from separate API map
    const finalRainfall = rainfallMm ?? rainfallFromMap;
    if (finalRainfall != null && finalRainfall >= 0) {
      await this.prisma.rainfall.create({
        data: { stationId, timestamp: now, valueMm: finalRainfall, durationMinutes: 360 },
      });
    }
  }
}
