from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
import io
from num2words import num2words

def get_ordinal_spanish(num: int) -> str:
    ordinals = {
        1: "PRIMERO", 2: "SEGUNDO", 3: "TERCERO", 4: "CUARTO", 5: "QUINTO",
        6: "SEXTO", 7: "SEPTIMO", 8: "OCTAVO", 9: "NOVENO", 10: "DECIMO",
        11: "DECIMO PRIMERO", 12: "DECIMO SEGUNDO", 13: "DECIMO TERCERO",
        14: "DECIMO CUARTO", 15: "DECIMO QUINTO", 16: "DECIMO SEXTO",
        17: "DECIMO SEPTIMO", 18: "DECIMO OCTAVO", 19: "DECIMO NOVENO",
        20: "VIGESIMO", 21: "VIGESIMO PRIMERO", 22: "VIGESIMO SEGUNDO",
        23: "VIGESIMO TERCERO", 24: "VIGESIMO CUARTO", 25: "VIGESIMO QUINTO",
        26: "VIGESIMO SEXTO", 27: "VIGESIMO SEPTIMO", 28: "VIGESIMO OCTAVO",
        29: "VIGESIMO NOVENO", 30: "TRIGESIMO"
    }
    return ordinals.get(num, str(num))

def get_number_word(num: int) -> str:
    words = {
        1: "UNA", 2: "DOS", 3: "TRES", 4: "CUATRO", 5: "CINCO", 6: "SEIS",
        7: "SIETE", 8: "OCHO", 9: "NUEVE", 10: "DIEZ", 11: "ONCE",
        12: "DOCE", 13: "TRECE", 14: "CATORCE", 15: "QUINCE",
        16: "DIECISEIS", 17: "DIECISIETE", 18: "DIECIOCHO", 19: "DIECINUEVE",
        20: "VEINTE", 21: "VEINTIUNA", 22: "VEINTIDOS", 23: "VEINTITRES",
        24: "VEINTICUATRO", 25: "VEINTICINCO", 26: "VEINTISEIS", 27: "VEINTISIETE",
        28: "VEINTIOCHO", 29: "VEINTINUEVE", 30: "TREINTA"
    }
    return words.get(num, str(num))

def generate_contract_pdf(worker_data: dict, payload: dict) -> bytes:
    from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=60, leftMargin=60, topMargin=60, bottomMargin=60)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], alignment=TA_CENTER, spaceAfter=20, fontSize=14, fontName="Helvetica-Bold")
    justify_style = ParagraphStyle('Justify', parent=styles['Normal'], alignment=TA_JUSTIFY, fontSize=10, leading=14, fontName="Helvetica")
    bold_justify = ParagraphStyle('BoldJustify', parent=justify_style, fontName="Helvetica-Bold")
    
    elements = []
    
    # Body
    intro_text = f"""
    En {payload.get('employer_city', 'Antofagasta')} a {payload.get('contract_date', '')}, entre <b>{payload.get('employer_company', '')}</b> 
    Rut <b>{payload.get('employer_rut', '')}</b>, Representado por <b>{payload.get('employer_rep', '')}</b> Rut <b>{payload.get('employer_rep_rut', '')}</b> 
    Ambos con domicilio en {payload.get('employer_address', '')} en, la ciudad de {payload.get('employer_city', '')}, correo electrónico 
    {payload.get('employer_email', '')}, en adelante el empleador, por una parte y por la otra, Sr. <b>{worker_data.get('first_name', '')} {worker_data.get('last_name', '')}</b> 
    con domicilio en {payload.get('worker_address', '')} en la comuna de {payload.get('worker_commune', '')}, región de {payload.get('worker_region', '')} 
    de nacionalidad {payload.get('worker_nationality', '')} Rut <b>{worker_data.get('rut', '')}</b>, estado civil {payload.get('worker_civil_status', '')} 
    nacido el día {payload.get('worker_birth_date', '')}, en adelante el trabajador, se ha convenido el siguiente Contrato Individual de Trabajo.
    """
    elements.append(Paragraph(intro_text, justify_style))
    elements.append(Spacer(1, 0.15 * inch))
    
    clauses = [
        f"<b>PRIMERO:</b> Don {worker_data.get('first_name', '')} {worker_data.get('last_name', '')}, se compromete a prestar sus servicios para el empleador en calidad de {payload.get('job_position', '')} en la Ciudad de {payload.get('job_city', '')}, en dependencias de la empresa {payload.get('job_site', '')}, ubicadas en {payload.get('job_site_address', '')}, según la obra denominada \"{payload.get('job_specific_task', '')}\", No obstante, todas aquellas labores inherentes al cargo, estas labores o funciones serán prestados en dependencia de {payload.get('job_site', '')}.",
        "<b>SEGUNDO:</b> El reglamento interno de la empresa y la ley 16.744, que el trabajador declara recibir un ejemplar y aceptar en todas sus partes, se considerará parte integrante del presente contrato para todos los efectos legales.",
        f"<b>TERCERO:</b> Las partes convienen una Jornada Laboral Ordinaria de {payload.get('work_schedule', '')}.",
        f"<b>CUARTO:</b> El empleador se compromete a pagar al trabajador, por sus servicios una remuneración base mensual de ${payload.get('base_salary', 0):,}.-, también el empleador pagará la gratificación legal de acuerdo al Art. 50 del código del trabajo.<br/><br/>Los conceptos de remuneración antes mencionados están sujetos a descuentos legales previsionales y tributarios que correspondan.<br/><br/>La remuneración se pagará el día 30 de cada mes, por período vencido. Si el día de pago recayere el día hábil se procederá a él, el día hábil anterior. El pago de realizará en dinero efectivo cheque vale vista u o transferencia bancaria a la cuenta del trabajador, previa deducción de los descuentos legales y previsionales que correspondan. Cada vez que esta remuneración sea reajustada o modificada, las partes suscribirán e anexos respectivos al pie del presente contrato o en un documento a parte.<br/><br/>Cualquier otra prestación ocasional que se conceda al trabajador, fuera de las que se pactan en este contrato se extenderá conferida de una mera libertad del empleador y ella no dará derecho alguno al trabajador, pudiendo la empresa suprimirla, suspenderla o modificar a su libre árbitro.",
        f"<b>QUINTO</b> El presente contrato comienza a regir del día {payload.get('contract_start_date', '')} y tendrá una duración de {payload.get('contract_duration', '')}, pudiendo las partes además ponerle término en conformidad a las normas que establece el CODIGO DEL TRABAJO VIGENTE.",
        "<b>SEXTO:</b> En el desempeño de sus funciones el trabajador deberá observar su recto comportamiento, quedándole prohibido divulgar cualquier antecedente que tenga relación con los negocios del empleador o sus clientes y/o proveedores y de los cuales el trabajador hubiere tomado conocimiento directo o indirectamente. Esto se extiende a las empresas relacionadas en las cuales intereses el empleador.<br/><br/>El trabajador se obliga a no retirar, sacar, traspasar, suministrar o proporcionar información relativa al giro de la empresa ya sea estas por medios escritos, electrónicos, magnéticos, computacionales o de cualquier otra forma.",
        "<b>SEPTIMO:</b> Serán considerados como causales de falta de probidad, a las que se refieren los numero 1 al 7 del artículo 160 del CODIGO DEL TRABAJO las siguientes infracciones.<br/><br/>El incumplimiento de las obligaciones señaladas en la cláusula sexta procedente.<br/><br/>La circunstancia de que el trabajador preste servicios remunerados o no a otra empresa o firma relacionada directa o indirectamente con las actividades que se desarrolle el empleador y sus empresas relacionadas en el cual tenga intereses, y/o dedique su tiempo funcionario a actividades particulares, salvo autorización escrita otorgada por ésta.<br/><br/>Desarrollar, promover o ejecutar el trabajador, por si o por interpósita persona, negociaciones que queden comprendidas dentro del giro de la sociedad empleadora o aquellas que tenga actividades particulares, salvo autorización escrita por ésta.<br/><br/>Comunicar o transmitir a terceros datos que sea o no confidenciales, que estén relacionadas directa o indirectamente con los negocios del empleador y aquellas que esta tenga intereses, de sus clientes o proveedores.<br/><br/>Las infracciones anotadas constituyen prohibiciones que tiene carácter de esenciales y determinantes para la celebración del presente contrato, configurando cada una de ellas individualmente por sí misma, la causal de caducidad ipso facto del contrato sin derecho a indemnización alguna.",
        "<b>OCTAVO:</b> En caso de inasistencia al trabajo por enfermedad, el trabajador deberá remitir la correspondiente licencia médica dentro de las 24 horas siguientes al día en que dejó de asistir al trabajo.",
        "<b>NOVENO:</b> Se entienden incorporadas al presente contrato todas las disposiciones legales que se dicten con posterioridad a su otorgamiento y que tengan relación con el texto precedente",
        f"<b>DECIMO:</b> Para todos los efectos legales derivado de la suscripción de este contrato las partes fijan su domicilio en la ciudad de {payload.get('employer_city', 'Antofagasta')} y se someten a la jurisdicción de sus tribunales.",
        "<b>DECIMO PRIMERO:</b> Se extiende incorporación al presente contrato de trabajo los documentos anexos que especifican la Descripción del cargo de trabajador y las obligaciones del trabajador relacionadas con el manejo de información reservada de la empresa.",
        f"<b>DECIMO SEGUNDO:</b> Se deja constancia que el trabajador comenzó a prestar sus servicios a las empresas a contar del día {payload.get('contract_start_date', '')} y que se encuentra afiliado en AFP {worker_data.get('pension_fund', '')} y su sistema de salud es {worker_data.get('health_institution', '')}."
    ]
    
    if payload.get('include_clause_13_14'):
        clauses.append(f"<b>DECIMO TERCERO:</b> Las partes acuerdan que la empresa {payload.get('employer_company', '')} RUT {payload.get('employer_rut', '')}, viene en dejar constancia de lo siguiente:<br/><br/>Que, con fecha {payload.get('old_labor_start_date', '')} usted inició relación laboral con la empresa {payload.get('old_employer_company', '')}, RUT {payload.get('old_employer_rut', '')}.<br/><br/>Que, producto del cambio de razón social, y existiendo continuidad operacional y administrativa, su contrato de trabajo pasará a depender de {payload.get('employer_company', '')}, RUT {payload.get('employer_rut', '')} a contar del día {payload.get('contract_start_date', '')}.<br/>La nueva empresa declara expresamente que:<br/><br/>- Reconoce íntegramente la antigüedad laboral del trabajador desde el {payload.get('old_labor_start_date', '')}.<br/>- Mantiene las condiciones pactadas de remuneración de sueldo base de ${payload.get('base_salary', 0):,}, jornada, cargo y demás estipulaciones contractuales.<br/>- Asume todos los derechos y obligaciones derivados de la relación laboral vigente.<br/>- Se respetan los feriados legales progresivos y demás beneficios adquiridos.")
        clauses.append("<b>DECIMO CUARTO:</b> Las partes declaran que el contrato de trabajo anterior del trabajador fue completamente finiquitado, que el trabajador mantendrá las condiciones laborales de higiene y seguridad de sus obligaciones y beneficios de su anterior empleador, y el trabajador acepta el traspaso a la nueva empresa en cuestión manteniendo la continuidad laboral de su contrato de trabajo.")
    
    current_clause_num = len(clauses) + 1
    custom_clauses = payload.get('custom_clauses', [])
    for custom in custom_clauses:
        if not custom.strip(): continue
        ord_str = get_ordinal_spanish(current_clause_num)
        clauses.append(f"<b>{ord_str}:</b> {custom}")
        current_clause_num += 1
        
    total_clauses = current_clause_num
    word_count = get_number_word(total_clauses)
    last_clause_label = get_ordinal_spanish(current_clause_num)
        
    clauses.append(f"<b>{last_clause_label}:</b> El presente contrato consta de {word_count} cláusulas y se suscribe en dos ejemplares de igual tenor y fecha, declarando haber recibido uno de ellos en este mismo acto y en señal de aceptación de las actuales condiciones acepta todo el tenor de este contrato.")
    
    for clause in clauses:
        elements.append(Paragraph(clause, justify_style))
        elements.append(Spacer(1, 0.15 * inch))
    
    elements.append(Spacer(1, 1 * inch))
    
    # Signatures
    data = [
        [f"{payload.get('employer_company', '')}", ""],
        ["Representante legal", f"{worker_data.get('first_name', '')} {worker_data.get('last_name', '')}"],
        [f"{payload.get('employer_rut', '')}", f"{worker_data.get('rut', '')}"]
    ]
    
    t = Table(data, colWidths=[3.2*inch, 3.2*inch])
    t.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    
    elements.append(t)
    
    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()

def generate_payslip_pdf(worker_data: dict, payroll_data: dict, payload) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], alignment=1, spaceAfter=20, fontSize=14)
    normal_bold = ParagraphStyle('NormalBold', parent=styles['Normal'], fontName='Helvetica-Bold')
    
    elements = []
    
    # 1. Company Header (Placeholder for Logo)
    elements.append(Paragraph("<b>[ ESPACIO PARA LOGO: MECWELL LTDA. ]</b>", normal_bold))
    elements.append(Paragraph("<b>MECWELL LIMITADA</b>", normal_bold))
    elements.append(Paragraph("<b>R.U.T. 78.349.631-3</b>", normal_bold))
    elements.append(Paragraph("<b>REPARACION DE OTRO TIPO MAQUINARIA Y EQUIPOS EN TERRENO</b>", normal_bold))
    elements.append(Paragraph("<b>URIBE 636 DEPTO.302 C NEGOCIOS</b>", normal_bold))
    elements.append(Paragraph("<b>ANTOFAGASTA</b>", normal_bold))
    elements.append(Spacer(1, 0.2 * inch))
    
    # Period table (right aligned visually)
    period_data = [[f"MES: {payload.period_month}", f"AÑO: {payload.period_year}"]]
    period_t = Table(period_data, colWidths=[2*inch, 2*inch], hAlign='RIGHT')
    period_t.setStyle(TableStyle([('BOX', (0,0), (-1,-1), 1, colors.black), ('GRID', (0,0), (-1,-1), 1, colors.black), ('FONTNAME', (0,0), (-1,-1), 'Helvetica-Bold')]))
    elements.append(period_t)
    elements.append(Spacer(1, 0.1 * inch))
    
    # 2. Document Title
    elements.append(Paragraph("<b>LIQUIDACION DE REMUNERACIONES</b>", title_style))
    
    # 3. Worker Info
    worker_info = [
        ["TRABAJADOR", f"{worker_data.get('first_name')} {worker_data.get('last_name')} "],
        ["RUT", worker_data.get('rut')],
        ["DIAS TRABAJADOS", str(payload.days_worked)],
        ["CARGO", worker_data.get('position')],
        ["AFP", worker_data.get('pension_fund')],
        ["SALUD", worker_data.get('health_institution')]
    ]
    t_worker = Table(worker_info, colWidths=[2*inch, 5*inch], hAlign='LEFT')
    t_worker.setStyle(TableStyle([
        ('FONTNAME', (0,0), (0,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('TOPPADDING', (0,0), (-1,-1), 2)
    ]))
    elements.append(t_worker)
    elements.append(Spacer(1, 0.2 * inch))
    
    # 4. Haberes y Descuentos Table
    fin_data = [
        ["HABERES", "", "DESCUENTOS", ""],
        ["SUELDO BASE", f"{payroll_data['proportional_base']:,}", f"TOTAL AFP {worker_data.get('pension_fund').upper()}", f"{payroll_data['afp_discount']:,}"],
        ["GRATIFICACION", f"{payroll_data['gratification']:,}" if payroll_data['gratification'] > 0 else "", "FONASA 7 %" if "fonasa" in worker_data.get('health_institution').lower() else f"ISAPRE ({worker_data.get('health_institution')})", f"{payroll_data['health_discount']:,}"],
        ["BONO RESPONS.", f"{payroll_data['bono_responsabilidad']:,}" if payroll_data['bono_responsabilidad'] > 0 else "", "SEGURO CESANTIA", f"{payroll_data['cesantia_discount']:,}"],
        ["HORAS EXTRAS", f"{payroll_data['horas_extras_amount']:,}" if payroll_data['horas_extras_amount'] > 0 else "", "DESCUENTOS PREVISIONALES", ""],
        ["", "", "IMPUESTO UNICO", "0"],
        ["", "", "", ""],
        ["TOTAL IMPONIBLE", f"{payroll_data['total_imponible']:,}", "TOTAL DESCUENTOS", f"{payroll_data['total_descuentos']:,}"],
        ["", "", "", ""],
        ["COLACIÓN", f"{payroll_data['colacion']:,}" if payroll_data['colacion'] > 0 else "", "ALCANCE LIQUIDO", f"{payroll_data['alcance_liquido']:,}"],
        ["MOVILIZACIÓN", f"{payroll_data['movilizacion']:,}" if payroll_data['movilizacion'] > 0 else "", "ANTICIPO", f"{payroll_data['anticipo']:,}" if payroll_data['anticipo'] > 0 else ""],
        ["VIATICO", f"{payroll_data['viatico']:,}" if payroll_data['viatico'] > 0 else "", "", ""],
        ["", "", "", ""],
        ["TOTAL HABERES NO IMPONIBLES", f"{payroll_data['total_no_imponible']:,}", "", ""],
        ["", "", "", ""],
        ["TOTAL HABERES", f"{payroll_data['total_haberes']:,}", "LIQUIDO A PAGAR", f"{payroll_data['liquido_a_pagar']:,}"]
    ]
    
    t_fin = Table(fin_data, colWidths=[2.5*inch, 1*inch, 2.5*inch, 1*inch])
    t_fin.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTNAME', (0,7), (-1,7), 'Helvetica-Bold'), # Totales imponible/descuento
        ('FONTNAME', (0,13), (-1,13), 'Helvetica-Bold'), # Total no imponible
        ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'), # Liquid a pagar
        ('ALIGN', (1,1), (1,-1), 'RIGHT'),
        ('ALIGN', (3,1), (3,-1), 'RIGHT'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('BOX', (0,0), (-1,-1), 1, colors.black),
        ('LINEABOVE', (0,7), (-1,7), 0.5, colors.gray),
        ('LINEABOVE', (0,-1), (-1,-1), 1, colors.black)
    ]))
    elements.append(t_fin)
    elements.append(Spacer(1, 0.2 * inch))
    
    # Text amount 
    monto_liquido = payroll_data.get('liquido_a_pagar', 0)
    monto_palabras = num2words(monto_liquido, lang='es').upper()
    elements.append(Paragraph(f"SON: <b>{monto_palabras} PESOS</b>", normal_bold))
    elements.append(Spacer(1, 0.2 * inch))
    
    # Certificate Text
    cert_text = """Certifico que he recibido de la empresa MECWELL LIMITADA a mi entera
satisfacción el saldo indicado en la presente liquidación y no tengo cargos ni cobros posteriores que hacer."""
    elements.append(Paragraph(cert_text, styles['Normal']))
    elements.append(Spacer(1, 0.4 * inch))
    
    # 5. Signatures
    sig_data = [
        ["Fecha Emisión:", "RECIBI CONFORME:"],
        ["(Fecha actual)", worker_data.get('rut')],
        ["", "_________________________"],
        ["", "Firma Trabajador"]
    ]
    t_sig = Table(sig_data, colWidths=[3.5*inch, 3.5*inch])
    t_sig.setStyle(TableStyle([
        ('FONTNAME', (1,0), (1,0), 'Helvetica-Bold'),
        ('ALIGN', (1,2), (1,3), 'CENTER')
    ]))
    elements.append(t_sig)
    
    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()

def generate_ppe_receipt_pdf(assignment: dict, worker: dict, item: dict) -> bytes:
    """Genera un Acta de Recepción de EPP/Material para ser firmada por el trabajador."""
    from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=60, leftMargin=60, topMargin=60, bottomMargin=60)

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], alignment=TA_CENTER, fontSize=14, fontName='Helvetica-Bold', spaceAfter=6)
    subtitle_style = ParagraphStyle('Subtitle', parent=styles['Normal'], alignment=TA_CENTER, fontSize=10, fontName='Helvetica', spaceAfter=20, textColor=colors.HexColor('#555555'))
    normal = ParagraphStyle('Normal', parent=styles['Normal'], fontSize=10, fontName='Helvetica', leading=14)
    bold_normal = ParagraphStyle('BoldNormal', parent=normal, fontName='Helvetica-Bold')
    justify_style = ParagraphStyle('Justify', parent=normal, alignment=TA_JUSTIFY)

    elements = []

    # Header
    elements.append(Paragraph("MECWELL LIMITADA", title_style))
    elements.append(Paragraph("RUT: 78.349.631-3 | Uribe # 636 depto. 302, Antofagasta", subtitle_style))
    elements.append(Spacer(1, 0.1 * inch))
    elements.append(Paragraph("ACTA DE ENTREGA DE EQUIPOS DE PROTECCIÓN PERSONAL (EPP) Y/O MATERIALES", bold_normal))
    elements.append(Spacer(1, 0.3 * inch))

    # Worker Info Table
    worker_name = f"{worker.get('first_name', '')} {worker.get('last_name', '')}".strip()
    worker_rut = worker.get('rut', '—')
    worker_position = worker.get('position', '—')
    assignment_date = assignment.get('assignment_date', '—')

    info_data = [
        ["Trabajador:", worker_name, "RUT:", worker_rut],
        ["Cargo:", worker_position, "Fecha de Entrega:", str(assignment_date)],
    ]
    t_info = Table(info_data, colWidths=[1.2*inch, 2.8*inch, 1.5*inch, 2*inch])
    t_info.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('LINEBELOW', (1, 0), (1, -1), 0.5, colors.gray),
        ('LINEBELOW', (3, 0), (3, -1), 0.5, colors.gray),
    ]))
    elements.append(t_info)
    elements.append(Spacer(1, 0.3 * inch))

    # Item table
    item_name = item.get('name', '—')
    item_category = item.get('category', '—')
    item_unit = item.get('unit_measure', 'unidad')
    item_qty = assignment.get('quantity', 1)
    is_returnable = item.get('is_returnable', False)

    elements.append(Paragraph("Detalle del Ítem Entregado:", bold_normal))
    elements.append(Spacer(1, 0.1 * inch))

    item_data = [
        ["Descripción", "Categoría", "Cantidad", "Unidad", "Retornable"],
        [item_name, item_category, str(item_qty), item_unit, "Sí" if is_returnable else "No"],
    ]
    t_item = Table(item_data, colWidths=[2.4*inch, 1.5*inch, 1*inch, 1*inch, 1.2*inch])
    t_item.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e3a5f')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (2, 0), (-1, -1), 'CENTER'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f0f4f8')]),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#cccccc')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#dddddd')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ('TOPPADDING', (0, 0), (-1, -1), 7),
    ]))
    elements.append(t_item)
    elements.append(Spacer(1, 0.35 * inch))

    # Declaration text
    declaration = f"""
    Yo, <b>{worker_name}</b>, RUT <b>{worker_rut}</b>, declaro haber recibido de <b>MECWELL LIMITADA</b> el/los 
    elemento(s) de protección personal y/o material(es) descritos en el cuadro precedente, en perfectas condiciones 
    de uso. Me comprometo a utilizarlos exclusivamente para las labores propias de mi cargo, a mantenerlos en buen 
    estado y a devolverlos en el mismo estado en que fueron entregados, cuando corresponda según su naturaleza.
    <br/><br/>
    Asimismo, declaro haber sido instruido sobre el correcto uso, mantención y cuidado de dichos elementos, y acepto 
    las responsabilidades derivadas de un uso indebido o pérdida por negligencia.
    """
    elements.append(Paragraph(declaration, justify_style))
    elements.append(Spacer(1, 0.6 * inch))

    # Signatures
    sig_data = [
        ["_________________________", "_________________________"],
        [f"{worker_name}", "Representante Empresa"],
        [f"RUT: {worker_rut}", "MECWELL LIMITADA"],
        ["Firma Trabajador", "Firma Empleador"],
    ]
    t_sig = Table(sig_data, colWidths=[3.5*inch, 3.5*inch])
    t_sig.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica'),
        ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
        ('FONTNAME', (0, 3), (-1, 3), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(t_sig)

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()

def generate_finiquito_pdf(worker: dict, finiquito: dict, items: list) -> bytes:
    """Genera el documento legal de Finiquito de Trabajo."""
    from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=60, leftMargin=60, topMargin=60, bottomMargin=60)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], alignment=TA_CENTER, spaceAfter=20, fontSize=14, fontName="Helvetica-Bold")
    justify_style = ParagraphStyle('Justify', parent=styles['Normal'], alignment=TA_JUSTIFY, fontSize=10, leading=14, fontName="Helvetica")
    bold_justify = ParagraphStyle('BoldJustify', parent=justify_style, fontName="Helvetica-Bold")
    
    elements = []
    
    elements.append(Paragraph("FINIQUITO DE TRABAJO", title_style))
    
    intro = f"""
    En la ciudad de Antofagasta, a {finiquito.get('fecha_finiquito', '')}, comparecen: por una parte, la empresa 
    <b>MECWELL LIMITADA</b>, RUT <b>78.349.631-3</b>, representada por don <b>Sergio Hans Farías Anabalón</b>, 
    en adelante indistintamente como el "empleador", y por la otra parte el trabajador(a) don(ña) 
    <b>{worker.get('first_name', '')} {worker.get('last_name', '')}</b>, RUT <b>{worker.get('rut', '')}</b>, 
    en adelante el "trabajador", quienes vienen en otorgar el siguiente finiquito de trabajo:
    """
    elements.append(Paragraph(intro, justify_style))
    elements.append(Spacer(1, 0.15 * inch))
    
    body = f"""
    <b>PRIMERO:</b> Las partes dejan constancia que la relación laboral que los unía ha terminado con fecha 
    {finiquito.get('fecha_ultimo_dia', '')}, por la causal del Artículo <b>{finiquito.get('causal_articulo', '')}</b> 
    del Código del Trabajo, esto es: <b>{finiquito.get('causal_descripcion', '')}</b>.
    <br/><br/>
    <b>SEGUNDO:</b> El empleador paga al trabajador, y este recibe a su entera satisfacción, las sumas que a 
    continuación se detallan:
    """
    elements.append(Paragraph(body, justify_style))
    elements.append(Spacer(1, 0.15 * inch))
    
    # Table of items
    table_data = [["Descripción de Conceptos", "Haberes ($)", "Descuentos ($)"]]
    for item in items:
        val = f"{item.get('valor', 0):,}"
        if item.get('tipo', '').startswith('hab'):
            table_data.append([item.get('nombre', ''), val, ""])
        else:
            table_data.append([item.get('nombre', ''), "", val])
    
    table_data.append(["<b>TOTAL NETO A PAGAR</b>", f"<b>{finiquito.get('monto_neto', 0):,}</b>", ""])
    
    t = Table(table_data, colWidths=[3.5*inch, 1.2*inch, 1.2*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F1F5F9')),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ('ALIGN', (1,1), (-1,-1), 'RIGHT'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 0.25 * inch))

    # Monto en palabras
    monto_neto = finiquito.get('monto_neto', 0)
    monto_palabras = num2words(monto_neto, lang='es').upper()
    elements.append(Paragraph(f"<b>SON: {monto_palabras} PESOS.-</b>", justify_style))
    elements.append(Spacer(1, 0.25 * inch))
    
    footer = f"""
    <b>TERCERO:</b> El trabajador declara que durante el tiempo que prestó servicios, recibió del empleador 
    puntual y oportunamente todas sus remuneraciones, beneficios, asignaciones y demás prestaciones derivadas 
    del contrato de trabajo y de la ley, no teniendo reclamo alguno que formular al respecto.
    <br/><br/>
    <b>CUARTO:</b> En consecuencia, el trabajador declara que no se le adeuda suma alguna por concepto de sueldos, 
    gratificaciones, vacaciones, horas extraordinarias, indemnizaciones, ni por ningún otro concepto, otorgando 
    al empleador el más amplio, completo y total finiquito, declarando que nada se le adeuda por causa de la 
    relación laboral que los unía.
    """
    elements.append(Paragraph(footer, justify_style))
    elements.append(Spacer(1, 0.8 * inch))
    
    # Signatures
    sig_data = [
        ["_________________________", "_________________________"],
        [f"{worker.get('first_name')} {worker.get('last_name')}", "MECWELL LIMITADA"],
        [f"RUT: {worker.get('rut')}", "p.p. Empleador"]
    ]
    tsig = Table(sig_data, colWidths=[3.2*inch, 3.2*inch])
    tsig.setStyle(TableStyle([('ALIGN', (0,0), (-1,-1), 'CENTER'), ('FONTSIZE', (0,0), (-1,-1), 10)]))
    elements.append(tsig)
    
    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()

def generate_notice_letter_pdf(worker: dict, data: dict) -> bytes:
    """Genera la Carta de Aviso de Término de Contrato."""
    from reportlab.lib.enums import TA_JUSTIFY, TA_RIGHT
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=60, leftMargin=60, topMargin=60, bottomMargin=60)
    styles = getSampleStyleSheet()
    
    elements = []
    
    elements.append(Paragraph(f"Antofagasta, {data.get('fecha_aviso', '')}", ParagraphStyle('Right', parent=styles['Normal'], alignment=TA_RIGHT)))
    elements.append(Spacer(1, 0.4 * inch))
    
    elements.append(Paragraph(f"Sr(a). <b>{worker.get('first_name')} {worker.get('last_name')}</b>", styles['Normal']))
    elements.append(Paragraph(f"RUT: <b>{worker.get('rut')}</b>", styles['Normal']))
    elements.append(Paragraph("Presente.", styles['Normal']))
    elements.append(Spacer(1, 0.4 * inch))
    
    elements.append(Paragraph("<b>REF: COMUNICACIÓN DE TÉRMINO DE CONTRATO DE TRABAJO</b>", styles['Normal']))
    elements.append(Spacer(1, 0.2 * inch))
    
    body = f"""
    De nuestra consideración:
    <br/><br/>
    Por intermedio de la presente, venimos en comunicar a usted la decisión de la empresa <b>MECWELL LIMITADA</b> 
    de poner término a su contrato de trabajo que lo vincula con nosotros, el cual se hará efectivo a contar del 
    día <b>{data.get('fecha_termino', '')}</b>.
    <br/><br/>
    La causal legal invocada es la del <b>Artículo {data.get('causal_articulo', '')}</b> del Código del Trabajo, 
    esto es, <b>"{data.get('causal_nombre', '')}"</b>.
    <br/><br/>
    Los hechos en que se funda esta causal consisten en: {data.get('causal_detalle', 'Término de la obra o faena para la cual fue contratado.')}
    <br/><br/>
    Le informamos que sus cotizaciones previsionales, de seguridad social y de salud se encuentran pagadas 
    al día de hoy, según consta en los certificados que se adjuntarán a su finiquito.
    <br/><br/>
    Sin otro particular, le saludamos atentamente.
    """
    elements.append(Paragraph(body, ParagraphStyle('Justify', parent=styles['Normal'], alignment=TA_JUSTIFY, leading=14)))
    elements.append(Spacer(1, 0.8 * inch))
    
    elements.append(Paragraph("_________________________", ParagraphStyle('Center', parent=styles['Normal'], alignment=1)))
    elements.append(Paragraph("<b>MECWELL LIMITADA</b>", ParagraphStyle('Center', parent=styles['Normal'], alignment=1)))
    elements.append(Paragraph("Empleador", ParagraphStyle('Center', parent=styles['Normal'], alignment=1)))
    
    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()

def generate_vacation_receipt_pdf(vacacion: dict, worker: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter,
                            rightMargin=inch, leftMargin=inch,
                            topMargin=inch, bottomMargin=inch)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'TitleStyle', parent=styles['Heading1'], alignment=1,
        fontSize=16, spaceAfter=20, fontName='Helvetica-Bold'
    )
    normal_style = ParagraphStyle(
        'NormalStyle', parent=styles['Normal'],
        fontSize=11, spaceAfter=12, leading=16, fontName='Helvetica'
    )
    bold_style = ParagraphStyle(
        'BoldStyle', parent=styles['Normal'],
        fontSize=11, spaceAfter=12, leading=16, fontName='Helvetica-Bold'
    )

    elements = []
    
    # Header
    elements.append(Paragraph("COMPROBANTE DE FERIADO LEGAL / PERMISO", title_style))
    elements.append(Spacer(1, 0.2 * inch))
    
    # Worker info
    elements.append(Paragraph("<b>1. ANTECEDENTES DEL TRABAJADOR</b>", bold_style))
    worker_rut = worker.get("rut", "")
    worker_name = f"{worker.get('first_name', '')} {worker.get('last_name', '')}"
    worker_position = worker.get("position", "")
    
    w_data = [
        ["Nombre:", worker_name, "RUT:", worker_rut],
        ["Cargo:", worker_position, "", ""]
    ]
    t = Table(w_data, colWidths=[1*inch, 2.5*inch, 0.8*inch, 2.2*inch])
    t.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTNAME', (2,0), (2,-1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 0.3 * inch))
    
    # Vacation info
    elements.append(Paragraph("<b>2. DETALLE DE DÍAS SOLICITADOS</b>", bold_style))
    
    v_data = [
        ["Fecha Inicio:", vacacion.get('fecha_inicio', '')],
        ["Fecha Término:", vacacion.get('fecha_fin', '')],
        ["Días Hábiles:", str(vacacion.get('dias_habiles', ''))],
        ["Observaciones:", vacacion.get('observaciones') or 'Ninguna']
    ]
    
    t2 = Table(v_data, colWidths=[1.8*inch, 4.7*inch])
    t2.setStyle(TableStyle([
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTNAME', (1,0), (1,-1), 'Helvetica'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(t2)
    elements.append(Spacer(1, 0.5 * inch))
    
    # Legal texts
    elements.append(Paragraph("De conformidad a lo establecido en la legislación vigente, se deja constancia de que el trabajador arriba individualizado hace uso de su Feriado Legal / Permiso con goce de remuneraciones por los días indicados.", normal_style))
    elements.append(Spacer(1, 1 * inch))
    
    # Signatures
    sig_data = [
        ["_________________________", "_________________________"],
        ["Firma Trabajador", "Firma Empleador"]
    ]
    t3 = Table(sig_data, colWidths=[3.25*inch, 3.25*inch])
    t3.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica-Bold'),
        ('TOPPADDING', (0,0), (-1,-1), 10),
    ]))
    elements.append(t3)
    
    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()

def generate_advance_receipt_pdf(advance: dict, worker: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter,
                            rightMargin=inch, leftMargin=inch,
                            topMargin=inch, bottomMargin=inch)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'TitleStyle', parent=styles['Heading1'], alignment=1,
        fontSize=16, spaceAfter=20, fontName='Helvetica-Bold'
    )
    normal_style = ParagraphStyle(
        'NormalStyle', parent=styles['Normal'],
        fontSize=11, spaceAfter=12, leading=16, fontName='Helvetica'
    )
    bold_style = ParagraphStyle(
        'BoldStyle', parent=styles['Normal'],
        fontSize=11, spaceAfter=12, leading=16, fontName='Helvetica-Bold'
    )

    elements = []
    
    # Header
    elements.append(Paragraph("COMPROBANTE DE ANTICIPO DE SUELDO", title_style))
    elements.append(Spacer(1, 0.2 * inch))
    
    # Worker info
    elements.append(Paragraph("<b>1. ANTECEDENTES DEL TRABAJADOR</b>", bold_style))
    worker_rut = worker.get("rut", "")
    worker_name = f"{worker.get('first_name', '')} {worker.get('last_name', '')}"
    worker_position = worker.get("position", "")
    
    w_data = [
        ["Nombre:", worker_name, "RUT:", worker_rut],
        ["Cargo:", worker_position, "", ""]
    ]
    t = Table(w_data, colWidths=[1*inch, 2.5*inch, 0.8*inch, 2.2*inch])
    t.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTNAME', (2,0), (2,-1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 0.3 * inch))
    
    # Advance info
    elements.append(Paragraph("<b>2. DETALLE DE ANTICIPO</b>", bold_style))
    
    monto = advance.get('amount', 0)
    from num2words import num2words
    monto_palabras = num2words(monto, lang='es').upper()
    
    a_data = [
        ["Fecha del Anticipo:", advance.get('date', '')],
        ["Monto Solicitado:", f"${monto:,.0f}"],
        ["Monto en Palabras:", f"SON: {monto_palabras} PESOS"],
        ["Motivo/Observación:", advance.get('reason') or 'Anticipo mensual']
    ]
    
    t2 = Table(a_data, colWidths=[1.8*inch, 4.7*inch])
    t2.setStyle(TableStyle([
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTNAME', (1,0), (1,-1), 'Helvetica'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(t2)
    elements.append(Spacer(1, 0.5 * inch))
    
    # Legal texts
    texto_legal = "Por medio del presente documento, declaro recibir a mi entera conformidad la cantidad señalada como anticipo de sueldo. Autorizo expresamente a mi empleador para que este monto sea descontado íntegramente en mi próxima liquidación de remuneraciones."
    elements.append(Paragraph(texto_legal, normal_style))
    elements.append(Spacer(1, 1 * inch))
    
    # Signatures
    sig_data = [
        ["_________________________", "_________________________"],
        ["Firma Trabajador", "Firma Empleador"]
    ]
    t3 = Table(sig_data, colWidths=[3.25*inch, 3.25*inch])
    t3.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica-Bold'),
        ('TOPPADDING', (0,0), (-1,-1), 10),
    ]))
    elements.append(t3)
    
    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()
