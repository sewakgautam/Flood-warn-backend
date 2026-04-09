import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.office365.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // Office365 uses STARTTLS on 587, not SSL
      tls: { ciphers: 'SSLv3' },
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  private appUrl() {
    return process.env.APP_URL || 'http://localhost:3500';
  }

  private severityColor(severity: string) {
    return { WATCH: '#eab308', WARNING: '#f97316', CRITICAL: '#ef4444' }[severity] ?? '#64748b';
  }

  async sendAlertEmail(opts: {
    to: string;
    stationName: string;
    severity: string;
    riverLevel: number | null;
    rainfall: number | null;
    unsubscribeToken: string;
  }) {
    const { to, stationName, severity, riverLevel, rainfall, unsubscribeToken } = opts;
    const color = this.severityColor(severity);
    const unsubUrl = `${this.appUrl()}/unsubscribe/${unsubscribeToken}`;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',sans-serif;color:#e2e8f0;">
  <div style="max-width:520px;margin:40px auto;background:#1e293b;border-radius:12px;overflow:hidden;border:1px solid #334155;">
    <div style="background:${color}18;border-bottom:3px solid ${color};padding:24px 28px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:${color};margin-bottom:6px;">FLOOD ALERT — ${severity}</div>
      <div style="font-size:22px;font-weight:700;color:#f1f5f9;">${stationName}</div>
    </div>
    <div style="padding:24px 28px;">
      <div style="display:flex;gap:16px;margin-bottom:24px;">
        ${riverLevel != null ? `
        <div style="flex:1;background:#0f172a;border-radius:8px;padding:14px;text-align:center;">
          <div style="font-size:11px;color:#64748b;font-weight:600;letter-spacing:1px;margin-bottom:4px;">RIVER LEVEL</div>
          <div style="font-size:24px;font-weight:700;color:${color};">${riverLevel.toFixed(2)} m</div>
        </div>` : ''}
        ${rainfall != null ? `
        <div style="flex:1;background:#0f172a;border-radius:8px;padding:14px;text-align:center;">
          <div style="font-size:11px;color:#64748b;font-weight:600;letter-spacing:1px;margin-bottom:4px;">RAINFALL (6h)</div>
          <div style="font-size:24px;font-weight:700;color:#38bdf8;">${rainfall.toFixed(1)} mm</div>
        </div>` : ''}
      </div>
      <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 20px;">
        Water levels at <strong style="color:#f1f5f9;">${stationName}</strong> have reached
        <strong style="color:${color};">${severity}</strong> level. Please take necessary precautions
        if you are in a downstream or flood-prone area.
      </p>
      <a href="${this.appUrl()}/map" style="display:inline-block;background:${color};color:#0f172a;font-weight:700;font-size:13px;padding:10px 20px;border-radius:8px;text-decoration:none;">
        View Live Map →
      </a>
    </div>
    <div style="padding:16px 28px;border-top:1px solid #334155;">
      <p style="margin:0;font-size:11px;color:#475569;">
        FloodWatch Nepal — Early Warning System &nbsp;·&nbsp;
        <a href="${unsubUrl}" style="color:#475569;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`;

    try {
      await this.transporter.sendMail({
        from: `"FloodWatch Nepal" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to,
        subject: `[${severity}] Flood Alert — ${stationName}`,
        html,
      });
      this.logger.log(`Alert email sent to ${to} for ${stationName} (${severity})`);
    } catch (err) {
      this.logger.error(`Failed to send alert email to ${to}:`, (err as Error).message);
    }
  }

  async sendConfirmation(opts: {
    to: string;
    stationName: string;
    severity: string;
    unsubscribeToken: string;
  }) {
    const { to, stationName, severity, unsubscribeToken } = opts;
    const color = this.severityColor(severity);
    const unsubUrl = `${this.appUrl()}/unsubscribe/${unsubscribeToken}`;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',sans-serif;color:#e2e8f0;">
  <div style="max-width:520px;margin:40px auto;background:#1e293b;border-radius:12px;overflow:hidden;border:1px solid #334155;">
    <div style="background:#00d4ff10;border-bottom:3px solid #00d4ff;padding:24px 28px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#00d4ff;margin-bottom:6px;">SUBSCRIPTION CONFIRMED</div>
      <div style="font-size:20px;font-weight:700;color:#f1f5f9;">FloodWatch Nepal</div>
    </div>
    <div style="padding:24px 28px;">
      <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 20px;">
        You are now subscribed to <strong style="color:#f1f5f9;">${severity}</strong> and above alerts for
        <strong style="color:#00d4ff;">${stationName}</strong>.
      </p>
      <div style="background:#0f172a;border-radius:8px;padding:16px;margin-bottom:20px;">
        <div style="font-size:12px;color:#64748b;margin-bottom:4px;">Alert threshold</div>
        <div style="font-size:16px;font-weight:700;color:${color};">${severity} level and above</div>
      </div>
      <p style="color:#64748b;font-size:13px;">You will receive an email when readings exceed the ${severity.toLowerCase()} threshold.</p>
    </div>
    <div style="padding:16px 28px;border-top:1px solid #334155;">
      <p style="margin:0;font-size:11px;color:#475569;">
        FloodWatch Nepal &nbsp;·&nbsp;
        <a href="${unsubUrl}" style="color:#475569;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`;

    try {
      await this.transporter.sendMail({
        from: `"FloodWatch Nepal" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to,
        subject: `Subscribed to alerts for ${stationName}`,
        html,
      });
    } catch (err) {
      this.logger.warn(`Confirmation email failed for ${to}:`, (err as Error).message);
    }
  }
}
