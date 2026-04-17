import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

// Single page gives us both river stations and rainfall stations in one fetch
const DHM_FLOOD_MONITORING = 'https://dhm.gov.np/hydrology/floodMonitoring';

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
      const { riverStations, rainfallStations } = await this.fetchFloodMonitoring();
      this.logger.log(`Found ${riverStations.length} river stations, ${rainfallStations.length} rainfall stations`);

      // Build rainfall lookup by coordinates for proximity matching
      const rainfallList = rainfallStations
        .filter(r => r.lat != null && r.lon != null)
        .map(r => ({
          lat: r.lat!,
          lon: r.lon!,
          mm6h: r.mm6h,
          mm24h: r.mm24h,
          rainfallWarning: r.rainfallWarning,
          rainfallDanger: r.rainfallDanger,
        }));

      let saved = 0;
      for (const s of riverStations) {
        try {
          const nearestRain = s.lat != null && s.lon != null
            ? this.nearestRainfall(s.lat, s.lon, rainfallList)
            : null;
          await this.saveStation(s, nearestRain);
          saved++;
        } catch (e) {
          this.logger.error(`Skip ${s.name}:`, (e as Error).message);
        }
      }

      this.logger.log(`Sync complete — saved ${saved}/${riverStations.length}`);
    } catch (err) {
      this.logger.error('Sync failed:', (err as Error).message);
    }
  }

  /** Single fetch from floodMonitoring page — returns both river and rainfall station arrays */
  private async fetchFloodMonitoring() {
    const res = await fetch(DHM_FLOOD_MONITORING, {
      signal: AbortSignal.timeout(25000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    const extract = (varName: string): any[] => {
      const m = html.match(new RegExp(`var\\s+${varName}\\s*=\\s*(\\[[\\s\\S]*?\\]);`));
      if (!m) throw new Error(`${varName} not found in floodMonitoring HTML`);
      return JSON.parse(m[1]);
    };

    const rawRiver    = extract('riverwatch_coordinates');
    const rawRainfall = extract('rainfall_coordinates');

    // ── River stations ───────────────────────────────────────────────
    const riverStations = rawRiver
      .filter(s => s.id && s.name)
      .map(s => {
        const elevation  = s.elevation != null ? parseFloat(s.elevation) : null;
        const rawLevel   = s.waterLevel?.value != null ? parseFloat(s.waterLevel.value) : null;
        const rawWarning = s.warning_level !== '' && s.warning_level != null ? parseFloat(s.warning_level) : null;
        const rawDanger  = s.danger_level  !== '' && s.danger_level  != null ? parseFloat(s.danger_level)  : null;

        // DHM mixes absolute MASL and gauge-height readings in the same feed.
        // If a value is > 50% of the station's base elevation it is in MASL → subtract.
        // Returns gauge height. If the value looks like MASL but we have no elevation
        // to subtract, return null so we don't store a misleading absolute reading.
        const toGauge = (val: number | null): number | null => {
          if (val == null) return null;
          if (elevation != null && val > elevation * 0.5) {
            return Math.round((val - elevation) * 1000) / 1000;
          }
          // No elevation available — if the value is suspiciously large (> 20m,
          // unlikely for a real gauge reading), discard it rather than store MASL.
          if (elevation == null && val > 20) return null;
          return val;
        };

        const trendRaw = (s.steady ?? '').toUpperCase();
        const trend = trendRaw === 'RISING' ? 'RISING'
                    : trendRaw === 'FALLING' ? 'FALLING'
                    : trendRaw === 'STEADY'  ? 'STEADY'
                    : null;

        return {
          dhmId:        String(s.id),
          name:         s.name.trim(),
          basin:        s.basin    || '',
          district:     s.district || '',
          lat:          s.latitude  != null ? parseFloat(s.latitude)  : null,
          lon:          s.longitude != null ? parseFloat(s.longitude) : null,
          elevation,
          waterLevel:   toGauge(rawLevel),
          warningLevel: toGauge(rawWarning),
          dangerLevel:  toGauge(rawDanger),
          trend,
          dhmStatus:    (s.status ?? '').toUpperCase(),
        };
      });

    // ── Rainfall stations ────────────────────────────────────────────
    // averages array: [{interval:1,value,status:{warning,danger}}, {interval:3}, {interval:6}, {interval:12}, {interval:24}]
    const rainfallStations = rawRainfall
      .filter(s => s.id && s.latitude != null && s.longitude != null)
      .map(s => {
        const avgs: any[] = s.averages ?? [];
        const get = (interval: number) => avgs.find(a => a.interval === interval);
        const avg6h  = get(6);
        const avg24h = get(24);
        return {
          lat:             parseFloat(s.latitude),
          lon:             parseFloat(s.longitude),
          mm6h:            avg6h?.value  != null ? parseFloat(avg6h.value)  : null,
          mm24h:           avg24h?.value != null ? parseFloat(avg24h.value) : null,
          rainfallWarning: avg6h?.status?.warning  ?? false,
          rainfallDanger:  avg6h?.status?.danger   ?? false,
        };
      });

    return { riverStations, rainfallStations };
  }

  /** Find the nearest rainfall station within 0.15° (~15 km). */
  private nearestRainfall(
    lat: number, lon: number,
    list: { lat: number; lon: number; mm6h: number | null; mm24h: number | null; rainfallWarning: boolean; rainfallDanger: boolean }[],
  ) {
    const THRESHOLD = 0.15;
    let best: { dist: number; data: typeof list[0] } | null = null;
    for (const r of list) {
      const dist = Math.sqrt((lat - r.lat) ** 2 + (lon - r.lon) ** 2);
      if (dist < THRESHOLD && (best === null || dist < best.dist)) {
        best = { dist, data: r };
      }
    }
    return best?.data ?? null;
  }

  private async saveStation(
    s: {
      dhmId: string; name: string; basin: string; district: string;
      lat: number | null; lon: number | null; elevation: number | null;
      waterLevel: number | null; warningLevel: number | null; dangerLevel: number | null;
      trend: string | null; dhmStatus: string;
    },
    nearestRain: { mm6h: number | null; mm24h: number | null; rainfallWarning: boolean; rainfallDanger: boolean } | null,
  ) {
    const stationId = `DHM-${s.dhmId}`;
    const location  = [s.basin ? `${s.basin} Basin` : '', s.district, 'Nepal'].filter(Boolean).join(', ');

    await this.prisma.station.upsert({
      where:  { id: stationId },
      create: { id: stationId, name: s.name, location, latitude: s.lat, longitude: s.lon, elevation: s.elevation, trend: s.trend, dhmStatus: s.dhmStatus || null, status: 'ONLINE', lastSeenAt: new Date() },
      update: { name: s.name, location, latitude: s.lat, longitude: s.lon, elevation: s.elevation, trend: s.trend, dhmStatus: s.dhmStatus || null, status: 'ONLINE', lastSeenAt: new Date() },
    });

    await this.prisma.stationThreshold.upsert({
      where:  { stationId },
      create: {
        stationId,
        ...(s.warningLevel ? { warningRiver: s.warningLevel } : {}),
        ...(s.dangerLevel  ? { criticalRiver: s.dangerLevel  } : {}),
      },
      update: {
        ...(s.warningLevel ? { warningRiver: s.warningLevel } : {}),
        ...(s.dangerLevel  ? { criticalRiver: s.dangerLevel  } : {}),
      },
    });

    const now = new Date();

    if (s.waterLevel != null && s.waterLevel > 0 && s.waterLevel < 9000) {
      await this.prisma.riverLevel.create({
        data: { stationId, timestamp: now, levelM: s.waterLevel, flowRateCms: null },
      });
    }

    // Use DHM's pre-computed 6h rainfall average from the nearest rainfall station.
    // Fall back to the 24h value if 6h is null.
    const finalRainfall = nearestRain?.mm6h ?? nearestRain?.mm24h ?? null;
    if (finalRainfall != null && finalRainfall >= 0) {
      await this.prisma.rainfall.create({
        data: { stationId, timestamp: now, valueMm: finalRainfall, durationMinutes: 360 },
      });
    }
  }
}
