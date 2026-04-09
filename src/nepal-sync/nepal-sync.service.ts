import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import puppeteer from 'puppeteer-core';

const DHM_RIVER_WATCH = 'https://dhm.gov.np/hydrology/river-watch';
const DHM_STATION_BASE = 'https://dhm.gov.np/hydrology/hms-Single';
const CHROMIUM_PATH = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser';

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
    let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;
    try {
      browser = await puppeteer.launch({
        executablePath: CHROMIUM_PATH,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        headless: true,
      });

      const stations = await this.scrapeStationList(browser);
      this.logger.log(`Found ${stations.length} stations`);
      if (stations.length === 0) {
        this.logger.warn('No stations found on DHM river-watch page');
        return;
      }

      let synced = 0;
      for (const station of stations) {
        try {
          const details = await this.scrapeStationDetail(browser, station.dhmId);
          await this.saveStation({ ...station, ...details });
          this.logger.log(`[${station.name}] level:${station.waterLevel}m lat:${details.lat} lon:${details.lon}`);
          synced++;
          await new Promise(r => setTimeout(r, 300));
        } catch (e) {
          this.logger.error(`Skip ${station.name}:`, (e as Error).message);
        }
      }
      this.logger.log(`Sync complete — ${synced}/${stations.length} stations saved`);
    } catch (err) {
      this.logger.error('Sync failed:', (err as Error).message);
    } finally {
      await browser?.close();
    }
  }

  private async scrapeStationList(browser: Awaited<ReturnType<typeof puppeteer.launch>>) {
    const page = await browser.newPage();
    try {
      await page.goto(DHM_RIVER_WATCH, { waitUntil: 'networkidle2', timeout: 30000 });
      // wait for table rows to appear
      await page.waitForSelector('table tbody tr', { timeout: 15000 });

      const stations = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table tbody tr'));
        return rows.map(row => {
          const cells = Array.from(row.querySelectorAll('td'));
          const link = row.querySelector('a[href*="hms-Single"]') as HTMLAnchorElement | null;
          const href = link?.href || '';
          const dhmIdMatch = href.match(/hms-Single\/(\d+)/i);
          const dhmId = dhmIdMatch ? dhmIdMatch[1] : null;
          const name = link?.textContent?.trim() || cells[2]?.textContent?.trim() || '';
          const basin = cells[1]?.textContent?.trim() || '';
          const district = cells[3]?.textContent?.trim() || '';
          const waterLevel = parseFloat(cells[4]?.textContent?.trim() || '');
          const discharge = parseFloat(cells[5]?.textContent?.trim() || '') || null;
          return { dhmId, name, basin, district, waterLevel, discharge };
        }).filter(s => s.dhmId && !isNaN(s.waterLevel) && s.waterLevel > -9000);
      });

      return stations;
    } finally {
      await page.close();
    }
  }

  private async scrapeStationDetail(browser: Awaited<ReturnType<typeof puppeteer.launch>>, dhmId: string) {
    const page = await browser.newPage();
    try {
      await page.goto(`${DHM_STATION_BASE}/${dhmId}`, { waitUntil: 'networkidle2', timeout: 20000 });

      const details = await page.evaluate(() => {
        const text = document.body.innerText;
        // look for lat/lon patterns like "27.6167" or "Latitude: 27.6167"
        const latMatch = text.match(/[Ll]atitude[:\s]*([0-9]{1,2}\.[0-9]+)/);
        const lonMatch = text.match(/[Ll]ongitude[:\s]*([0-9]{2,3}\.[0-9]+)/);
        // also try from meta or data attributes
        const latEl = document.querySelector('[data-lat],[data-latitude]');
        const lonEl = document.querySelector('[data-lon],[data-longitude]');
        const lat = latEl
          ? parseFloat((latEl as HTMLElement).dataset.lat || (latEl as HTMLElement).dataset.latitude || '')
          : latMatch ? parseFloat(latMatch[1]) : null;
        const lon = lonEl
          ? parseFloat((lonEl as HTMLElement).dataset.lon || (lonEl as HTMLElement).dataset.longitude || '')
          : lonMatch ? parseFloat(lonMatch[1]) : null;
        return { lat, lon };
      });

      return details;
    } finally {
      await page.close();
    }
  }

  private async saveStation({ dhmId, name, basin, district, waterLevel, discharge, lat, lon }: {
    dhmId: string; name: string; basin: string; district: string;
    waterLevel: number; discharge: number | null;
    lat: number | null; lon: number | null;
  }) {
    const stationId = `DHM-${dhmId}`;
    const location = `${basin} Basin${district ? ', ' + district : ''}, Nepal`;

    await this.prisma.station.upsert({
      where: { id: stationId },
      create: { id: stationId, name, location, latitude: lat, longitude: lon, status: 'ONLINE', lastSeenAt: new Date() },
      update: { status: 'ONLINE', lastSeenAt: new Date(), name, location, ...(lat != null ? { latitude: lat, longitude: lon } : {}) },
    });
    await this.prisma.stationThreshold.upsert({
      where: { stationId },
      create: { stationId },
      update: {},
    });

    const now = new Date();
    if (waterLevel > 0 && waterLevel < 100) {
      await this.prisma.riverLevel.create({
        data: { stationId, timestamp: now, levelM: waterLevel, flowRateCms: discharge },
      });
    }
  }
}
