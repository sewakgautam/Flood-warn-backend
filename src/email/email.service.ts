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

  private severityNepali(severity: string) {
    return { WATCH: 'सतर्कता', WARNING: 'चेतावनी', CRITICAL: 'गम्भीर' }[severity] ?? severity;
  }

  async sendAlertEmail(opts: {
    to: string;
    stationName: string;
    severity: string;
    riverLevel: number | null;
    rainfall: number | null;
    unsubscribeToken: string;
    isDeescalation?: boolean;
  }) {
    const { to, stationName, severity, riverLevel, rainfall, unsubscribeToken, isDeescalation = false } = opts;
    const color = this.severityColor(severity);
    const unsubUrl = `${this.appUrl()}/unsubscribe/${unsubscribeToken}`;

    const sevNe = this.severityNepali(severity);

    const headerLabelEn = isDeescalation ? `FLOOD UPDATE — RECEDING TO ${severity}` : `FLOOD ALERT — ${severity}`;
    const headerLabelNe = isDeescalation ? `बाढी अपडेट — ${sevNe} स्तरमा घट्दैछ` : `बाढी सूचना — ${sevNe}`;

    const bodyEn = isDeescalation
      ? `Water levels at <strong style="color:#f1f5f9;">${stationName}</strong> are receding but remain at <strong style="color:${color};">${severity}</strong> level. You are still in an elevated risk zone — continue to stay alert and avoid flood-prone areas.`
      : `Water levels at <strong style="color:#f1f5f9;">${stationName}</strong> have reached <strong style="color:${color};">${severity}</strong> level. Please take necessary precautions if you are in a downstream or flood-prone area.`;

    const bodyNe = isDeescalation
      ? `<strong style="color:#f1f5f9;">${stationName}</strong> मा जलस्तर घट्दैछ तर अझै <strong style="color:${color};">${sevNe}</strong> स्तरमा छ। तपाईं अझै उच्च जोखिम क्षेत्रमा हुनुहुन्छ — सतर्क रहनुहोस् र बाढी-प्रभावित क्षेत्रहरूबाट टाढा रहनुहोस्।`
      : `<strong style="color:#f1f5f9;">${stationName}</strong> मा जलस्तर <strong style="color:${color};">${sevNe}</strong> स्तरमा पुगेको छ। यदि तपाईं तल्लो भेग वा बाढी-जोखिम क्षेत्रमा हुनुहुन्छ भने आवश्यक सावधानी अपनाउनुहोस्।`;

    const subject = isDeescalation
      ? `[अपडेट / UPDATE] बाढी घट्दैछ — अझै ${sevNe} — ${stationName}`
      : `[${sevNe} / ${severity}] बाढी सूचना — ${stationName}`;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',sans-serif;color:#e2e8f0;">
  <div style="max-width:520px;margin:40px auto;background:#1e293b;border-radius:12px;overflow:hidden;border:1px solid #334155;">

    <!-- Nepali header -->
    <div style="background:${color}18;border-bottom:3px solid ${color};padding:20px 28px 14px;">
      <div style="font-size:12px;font-weight:700;letter-spacing:1px;color:${color};margin-bottom:4px;">${headerLabelNe}</div>
      <div style="font-size:10px;font-weight:600;color:${color}88;letter-spacing:2px;margin-bottom:8px;">${headerLabelEn}</div>
      <div style="font-size:20px;font-weight:700;color:#f1f5f9;">${stationName}</div>
    </div>

    <!-- Readings -->
    <div style="padding:20px 28px 0;">
      <div style="display:flex;gap:16px;margin-bottom:20px;">
        ${riverLevel != null ? `
        <div style="flex:1;background:#0f172a;border-radius:8px;padding:14px;text-align:center;">
          <div style="font-size:10px;color:#64748b;font-weight:600;letter-spacing:1px;margin-bottom:2px;">नदीको जलस्तर</div>
          <div style="font-size:10px;color:#3a4a5a;margin-bottom:4px;">RIVER LEVEL</div>
          <div style="font-size:24px;font-weight:700;color:${color};">${riverLevel.toFixed(2)} m</div>
        </div>` : ''}
        ${rainfall != null ? `
        <div style="flex:1;background:#0f172a;border-radius:8px;padding:14px;text-align:center;">
          <div style="font-size:10px;color:#64748b;font-weight:600;letter-spacing:1px;margin-bottom:2px;">वर्षा (६ घण्टा)</div>
          <div style="font-size:10px;color:#3a4a5a;margin-bottom:4px;">RAINFALL (6h)</div>
          <div style="font-size:24px;font-weight:700;color:#38bdf8;">${rainfall.toFixed(1)} mm</div>
        </div>` : ''}
      </div>
    </div>

    <!-- Nepali body -->
    <div style="padding:0 28px 20px;">
      <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin:0 0 10px;">${bodyNe}</p>
      <!-- English body (smaller, muted) -->
      <p style="color:#64748b;font-size:12px;line-height:1.6;margin:0 0 20px;border-top:1px solid #1e3a4a;padding-top:10px;">${bodyEn}</p>
      <a href="${this.appUrl()}/map" style="display:inline-block;background:${color};color:#0f172a;font-weight:700;font-size:13px;padding:10px 20px;border-radius:8px;text-decoration:none;">
        लाइभ नक्सा हेर्नुहोस् / View Live Map →
      </a>
    </div>

    <div style="padding:16px 28px;border-top:1px solid #334155;">
      <p style="margin:0;font-size:11px;color:#475569;">
        बाढी सतर्कता नेपाल — FloodWatch Nepal &nbsp;·&nbsp;
        <a href="${unsubUrl}" style="color:#475569;">सदस्यता रद्द गर्नुहोस् / Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`;

    try {
      await this.transporter.sendMail({
        from: `"FloodWatch Nepal" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to,
        subject,
        html,
      });
      this.logger.log(`Alert email sent to ${to} for ${stationName} (${severity}${isDeescalation ? ', de-escalation' : ''})`);
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
    const sevNe = this.severityNepali(severity);
    const unsubUrl = `${this.appUrl()}/unsubscribe/${unsubscribeToken}`;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',sans-serif;color:#e2e8f0;">
  <div style="max-width:520px;margin:40px auto;background:#1e293b;border-radius:12px;overflow:hidden;border:1px solid #334155;">
    <div style="background:#00d4ff10;border-bottom:3px solid #00d4ff;padding:20px 28px 14px;">
      <div style="font-size:13px;font-weight:700;color:#00d4ff;margin-bottom:3px;">सदस्यता पुष्टि भयो</div>
      <div style="font-size:10px;font-weight:600;color:#00d4ff88;letter-spacing:2px;margin-bottom:8px;">SUBSCRIPTION CONFIRMED</div>
      <div style="font-size:18px;font-weight:700;color:#f1f5f9;">बाढी सतर्कता नेपाल · FloodWatch Nepal</div>
    </div>
    <div style="padding:24px 28px;">
      <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin:0 0 12px;">
        तपाईं <strong style="color:#00d4ff;">${stationName}</strong> को लागि
        <strong style="color:${color};">${sevNe}</strong> र माथिका सूचनाहरूमा सदस्यता लिनुभएको छ।
      </p>
      <p style="color:#64748b;font-size:12px;line-height:1.6;margin:0 0 20px;border-top:1px solid #1e3a4a;padding-top:10px;">
        You are now subscribed to <strong style="color:#f1f5f9;">${severity}</strong> and above alerts for
        <strong style="color:#00d4ff;">${stationName}</strong>.
      </p>
      <div style="background:#0f172a;border-radius:8px;padding:16px;margin-bottom:16px;">
        <div style="font-size:11px;color:#64748b;margin-bottom:2px;">सूचना सीमा / Alert threshold</div>
        <div style="font-size:16px;font-weight:700;color:${color};">${sevNe} / ${severity} र माथि / and above</div>
      </div>
      <p style="color:#64748b;font-size:12px;">
        जलस्तर ${sevNe.toLowerCase()} सीमा नाघेपछि तपाईंलाई इमेल आउनेछ।<br/>
        You will receive an email when readings exceed the ${severity.toLowerCase()} threshold.
      </p>
    </div>
    <div style="padding:16px 28px;border-top:1px solid #334155;">
      <p style="margin:0;font-size:11px;color:#475569;">
        बाढी सतर्कता नेपाल · FloodWatch Nepal &nbsp;·&nbsp;
        <a href="${unsubUrl}" style="color:#475569;">सदस्यता रद्द गर्नुहोस् / Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`;

    try {
      await this.transporter.sendMail({
        from: `"FloodWatch Nepal" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to,
        subject: `${stationName} को सूचना सदस्यता / Subscribed to alerts`,
        html,
      });
    } catch (err) {
      this.logger.warn(`Confirmation email failed for ${to}:`, (err as Error).message);
    }
  }
}
