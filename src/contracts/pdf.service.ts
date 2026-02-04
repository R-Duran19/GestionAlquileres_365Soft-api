import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { Contract } from './entities/contract.entity';

@Injectable()
export class PdfService {
  async generateContractPdf(
    contract: Contract,
    tenantInfo: { name?: string; address?: string },
  ): Promise<string> {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const fileName = `contract_${contract.contract_number}.pdf`;
    const filePath = path.join(process.cwd(), 'uploads', 'contracts', fileName);

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // --- HEADER ---
    // doc.image('path/to/logo.png', 50, 45, { width: 50 }); // Add logo if available
    doc.fontSize(20).text('CONTRATO DE ARRENDAMIENTO', { align: 'center' });
    doc.moveDown();
    doc
      .fontSize(10)
      .text(`Contrato N°: ${contract.contract_number}`, { align: 'right' });
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, {
      align: 'right',
    });
    doc.moveDown();

    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // --- PARTES ---
    doc.fontSize(12).text('PARTES DEL CONTRATO', { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(10).text('EL ARRENDADOR:', { oblique: true });
    doc.text(`Nombre: ${tenantInfo.name || 'Empresa Administradora'}`);
    doc.text(`Dirección: ${tenantInfo.address || 'N/A'}`);
    doc.moveDown(0.5);

    doc.text('EL ARRENDATARIO (INQUILINO):', { oblique: true });
    doc.text(`ID Inquilino: ${contract.tenant_id}`);
    doc.moveDown(0.5);

    doc.text(`LA PROPIEDAD:`, { oblique: true });
    doc.text(`Nombre: ${contract.property.title}`);

    if (contract.property.addresses && contract.property.addresses.length > 0) {
      const addr = contract.property.addresses[0];
      doc.text(
        `Dirección: ${addr.street_address || ''}, ${addr.city || ''} ${
          addr.state || ''
        }, ${addr.country || ''}`,
      );
    }
    doc.moveDown();

    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // --- CLAUSULAS ---
    doc.fontSize(12).text('CLAUSULAS DEL CONTRATO', { underline: true });
    doc.moveDown(0.5);

    this.addClause(
      doc,
      'PRIMERA. OBJETO DEL CONTRATO',
      'El Arrendador cede en arrendamiento al Arrendatario la propiedad descrita anteriormente para uso exclusivamente residencial.',
    );

    this.addClause(
      doc,
      'SEGUNDA. DURACIÓN',
      `El presente contrato tendrá una duración de ${
        contract.duration_months
      } meses, iniciando el ${new Date(
        contract.start_date,
      ).toLocaleDateString()} y finalizando el ${new Date(
        contract.end_date,
      ).toLocaleDateString()}.`,
    );

    this.addClause(
      doc,
      'TERCERA. RENTA MENSUAL',
      `El monto del alquiler mensual es de ${contract.monthly_rent} ${contract.currency}, pagaderos los días ${contract.payment_day} de cada mes.`,
    );

    this.addClause(
      doc,
      'CUARTA. DEPÓSITO DE GARANTÍA',
      `El Arrendatario entrega en este acto la suma de ${contract.deposit_amount} ${contract.currency} en concepto de depósito de garantía.`,
    );

    if (contract.included_services && contract.included_services.length > 0) {
      this.addClause(
        doc,
        'QUINTA. SERVICIOS INCLUIDOS',
        `Los servicios incluidos son: ${contract.included_services.join(', ')}.`,
      );
    }

    doc.addPage();

    this.addClause(
      doc,
      'SEXTA. OBLIGACIONES Y PROHIBICIONES',
      contract.prohibitions ||
        'El Arrendatario se compromete a mantener la propiedad en buen estado.',
    );

    this.addClause(
      doc,
      'SEPTIMA. JURISDICCIÓN',
      `Para cualquier conflicto legal, las partes se someten a la jurisdicción de ${contract.jurisdiction}.`,
    );

    doc.moveDown(2);

    // --- FIRMAS ---
    doc
      .fontSize(12)
      .text('________________________           ________________________', {
        align: 'center',
      });
    doc
      .fontSize(10)
      .text('Firma del Arrendatario              Firma del Arrendador', {
        align: 'center',
      });

    doc.moveDown(4);
    doc
      .fillColor('gray')
      .fontSize(8)
      .text(
        `Documento generado automáticamente el ${new Date().toLocaleString()}`,
        { align: 'center' },
      );
    doc.fillColor('black').text(`Página 1 de 1`, { align: 'right' }); // Basic pagination

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    });
  }

  private addClause(doc: PDFKit.PDFDocument, title: string, content: string) {
    doc.font('Helvetica-Bold').fontSize(11).text(title);
    doc.font('Helvetica').fontSize(10).text(content, { align: 'justify' });
    doc.moveDown();
  }
}
