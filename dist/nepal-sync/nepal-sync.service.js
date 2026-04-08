"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NepalSyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NepalSyncService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const NEPAL_STATIONS = [
    { dhmId: '35', name: 'Karnali at Chisapani', basin: 'Karnali', lat: 28.6167, lon: 81.2833 },
    { dhmId: '86', name: 'Karnali at Asaraghat', basin: 'Karnali', lat: 29.0667, lon: 81.7167 },
    { dhmId: '104', name: 'Sunkoshi at Pachuwarghat', basin: 'Koshi', lat: 27.6500, lon: 85.9833 },
    { dhmId: '199', name: 'Sunkoshi at Dolalghat', basin: 'Koshi', lat: 27.6333, lon: 85.7833 },
    { dhmId: '243', name: 'Sunkoshi at Khurkot', basin: 'Koshi', lat: 27.3333, lon: 86.0667 },
    { dhmId: '50', name: 'Bagmati at Khokana', basin: 'Bagmati', lat: 27.6167, lon: 85.3000 },
    { dhmId: '52', name: 'Trishuli at Betrawati', basin: 'Narayani', lat: 28.0833, lon: 85.1500 },
    { dhmId: '171', name: 'West Rapti at Bagasoti', basin: 'W.Rapti', lat: 28.0500, lon: 82.3833 },
    { dhmId: '174', name: 'Tinau at Butwal', basin: 'Tinau', lat: 27.6833, lon: 83.4500 },
    { dhmId: '212', name: 'Tamor at Majhitar', basin: 'Koshi', lat: 26.9667, lon: 87.5667 },
    { dhmId: '172', name: 'Marsyangdi at Bimalnagar', basin: 'Narayani', lat: 27.9500, lon: 84.3667 },
    { dhmId: '78', name: 'Mahakali at Parigaon', basin: 'Mahakali', lat: 29.3000, lon: 80.5667 },
    { dhmId: '237', name: 'Tamor at Mulghat', basin: 'Koshi', lat: 26.8833, lon: 87.3667 },
    { dhmId: '110', name: 'Dudh Koshi at Rabuwabazar', basin: 'Koshi', lat: 27.3500, lon: 86.6167 },
    { dhmId: '9', name: 'Melamchi at Nakote', basin: 'Koshi', lat: 27.8833, lon: 85.5500 },
];
let NepalSyncService = NepalSyncService_1 = class NepalSyncService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(NepalSyncService_1.name);
        this.dhmProxyUrl = process.env.DHM_PROXY_URL || 'http://host.docker.internal:9876/dhm-data';
    }
    async onApplicationBootstrap() {
        await this.runSync();
    }
    async runSync() {
        this.logger.log(`Sync cycle — ${new Date().toISOString()}`);
        const dhmReadings = await this.fetchDHMData();
        if (dhmReadings.length === 0) {
            this.logger.warn('No DHM data — is proxy running? (node ~/dhm-proxy.js)');
            return;
        }
        await this.syncAllDHM(dhmReadings);
        await this.syncCrossValidated(dhmReadings);
        this.logger.log('Sync cycle complete');
    }
    stripHtml(html) {
        return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }
    async fetchDHMData() {
        this.logger.log(`Fetching via proxy: ${this.dhmProxyUrl}`);
        try {
            const res = await fetch(this.dhmProxyUrl, { signal: AbortSignal.timeout(20000) });
            if (!res.ok)
                throw new Error(`Proxy HTTP ${res.status}`);
            const html = await res.text();
            const rows = [];
            const trBlocks = html.split(/<tr[^>]*>/i).slice(1);
            for (const block of trBlocks) {
                const tdMatches = [...block.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)];
                if (tdMatches.length < 6)
                    continue;
                const cells = tdMatches.map(m => this.stripHtml(m[1]));
                const rowNum = parseInt(cells[0]);
                if (isNaN(rowNum) || rowNum < 1)
                    continue;
                const hrefMatch = block.match(/hms-Single\/(\d+)/i);
                const dhmId = hrefMatch ? hrefMatch[1] : null;
                const nameMatch = block.match(/class="text-primary[^"]*"[^>]*>\s*([\s\S]*?)<\/a>/i);
                const stationName = nameMatch ? this.stripHtml(nameMatch[1]) : cells[3] || '';
                const basin = cells[1] || '';
                const district = cells[4] || '';
                const waterLevel = parseFloat(cells[5]);
                const discharge = parseFloat(cells[6]) || null;
                if (dhmId && !isNaN(waterLevel) && waterLevel > -9000 && waterLevel < 2000) {
                    rows.push({ dhmId, basin: basin.trim(), stationName: stationName.trim(), district: district.trim(), waterLevel_m: waterLevel, discharge_cms: discharge });
                }
            }
            this.logger.log(`Parsed ${rows.length} stations`);
            return rows;
        }
        catch (err) {
            this.logger.error('Fetch failed:', err.message);
            return [];
        }
    }
    async fetchRainfall(lat, lon) {
        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=precipitation&past_hours=6&forecast_hours=0&timezone=Asia%2FKathmandu`;
            const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
            if (!res.ok)
                throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const values = data.hourly?.precipitation || [];
            return Math.round(values.reduce((s, v) => s + (v || 0), 0) * 100) / 100;
        }
        catch (err) {
            this.logger.error('Rain fetch:', err.message);
            return null;
        }
    }
    async fetchDischarge(lat, lon) {
        try {
            const url = `https://flood-api.open-meteo.com/v1/flood?latitude=${lat}&longitude=${lon}&daily=river_discharge&past_days=1&forecast_days=1`;
            const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
            if (!res.ok)
                throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const values = data.daily?.river_discharge || [];
            const val = values[values.length - 1];
            return val != null ? Math.round(val * 100) / 100 : null;
        }
        catch (err) {
            this.logger.error('Discharge fetch:', err.message);
            return null;
        }
    }
    crossValidate(dhmLevel, discharge) {
        if (dhmLevel < 0 || dhmLevel > 50) {
            return { confidence: 'INVALID', flags: ['SENSOR_ERROR'], notes: [`Bad reading: ${dhmLevel}m`] };
        }
        const result = { confidence: 'HIGH', flags: [], notes: [] };
        if (discharge != null) {
            if (discharge > 500 && dhmLevel < 3.0) {
                result.confidence = 'MEDIUM';
                result.flags.push('DISCHARGE_LEVEL_MISMATCH');
                result.notes.push(`OM discharge high (${discharge.toFixed(0)} m³/s) but DHM level low (${dhmLevel}m)`);
            }
            else if (discharge < 100 && dhmLevel > 3.0) {
                result.confidence = 'MEDIUM';
                result.flags.push('LEVEL_DISCHARGE_MISMATCH');
                result.notes.push(`DHM level high (${dhmLevel}m) but discharge low (${discharge.toFixed(0)} m³/s)`);
            }
        }
        return result;
    }
    async saveReading({ stationId, name, location, lat, lon, levelM, flowRateCms, rainfallMm, flags, notes }) {
        await this.prisma.station.upsert({
            where: { id: stationId },
            create: { id: stationId, name, location, latitude: lat ?? null, longitude: lon ?? null, status: 'ONLINE', lastSeenAt: new Date() },
            update: { status: 'ONLINE', lastSeenAt: new Date(), ...(lat != null ? { latitude: lat, longitude: lon } : {}) },
        });
        await this.prisma.stationThreshold.upsert({
            where: { stationId },
            create: { stationId },
            update: {},
        });
        const now = new Date();
        if (levelM != null && levelM > 0 && levelM < 100) {
            await this.prisma.riverLevel.create({ data: { stationId, timestamp: now, levelM, flowRateCms: flowRateCms ?? null } });
        }
        if (rainfallMm != null) {
            await this.prisma.rainfall.create({ data: { stationId, timestamp: now, valueMm: rainfallMm, durationMinutes: 360 } });
        }
        if (flags?.length > 0) {
            await this.prisma.alert.create({
                data: { stationId, severity: 'WATCH', message: `Data quality: ${notes.join(' | ')}`, source: 'auto' },
            }).catch(() => { });
        }
    }
    async syncAllDHM(dhmReadings) {
        this.logger.log(`Saving ${dhmReadings.length} stations...`);
        let saved = 0;
        for (const r of dhmReadings) {
            if (!r.dhmId || r.waterLevel_m <= 0 || r.waterLevel_m > 100)
                continue;
            try {
                await this.saveReading({
                    stationId: `DHM-${r.dhmId}`,
                    name: r.stationName,
                    location: `${r.basin} Basin${r.district ? ', ' + r.district : ''}, Nepal`,
                    levelM: r.waterLevel_m,
                    flowRateCms: r.discharge_cms,
                    flags: [], notes: [],
                });
                saved++;
            }
            catch (e) {
                this.logger.error(`Skip ${r.stationName}:`, e.message);
            }
        }
        this.logger.log(`Saved ${saved} readings`);
    }
    async syncCrossValidated(dhmReadings) {
        this.logger.log('Syncing key stations with Open-Meteo...');
        let synced = 0, skipped = 0;
        for (const def of NEPAL_STATIONS) {
            const dhm = dhmReadings.find(r => r.dhmId === def.dhmId);
            if (!dhm) {
                skipped++;
                continue;
            }
            const [rainfallMm, discharge] = await Promise.all([
                this.fetchRainfall(def.lat, def.lon),
                this.fetchDischarge(def.lat, def.lon),
            ]);
            const v = this.crossValidate(dhm.waterLevel_m, discharge);
            this.logger.log(`[${def.name}] DHM:${dhm.waterLevel_m}m Rain:${rainfallMm ?? 'N/A'}mm → ${v.confidence}`);
            if (v.confidence === 'INVALID') {
                skipped++;
                continue;
            }
            await this.saveReading({
                stationId: `DHM-${def.dhmId}`,
                name: def.name,
                location: `${def.basin} Basin, Nepal`,
                lat: def.lat, lon: def.lon,
                levelM: dhm.waterLevel_m,
                flowRateCms: discharge ?? dhm.discharge_cms,
                rainfallMm,
                flags: v.flags, notes: v.notes,
            });
            synced++;
            await new Promise(r => setTimeout(r, 400));
        }
        this.logger.log(`Done — ${synced} synced, ${skipped} skipped`);
    }
};
exports.NepalSyncService = NepalSyncService;
__decorate([
    (0, schedule_1.Interval)(30 * 60 * 1000),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NepalSyncService.prototype, "runSync", null);
exports.NepalSyncService = NepalSyncService = NepalSyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NepalSyncService);
//# sourceMappingURL=nepal-sync.service.js.map