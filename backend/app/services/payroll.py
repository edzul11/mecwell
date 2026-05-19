AFP_RATES = {
    'Modelo': 0.1058,
    'Habitat': 0.1127,
    'Capital': 0.1144,
    'Cuprum': 0.1144,
    'Provida': 0.1145,
    'PlanVital': 0.1116,
    'Uno': 0.1069
}

def calculate_payslip(
    base_salary: float, 
    afp_name: str, 
    health_name: str,
    days_worked: int = 30,
    gratification: float = 0,
    bono_responsabilidad: float = 0,
    horas_extras_amount: float = 0,
    colacion: float = 0,
    movilizacion: float = 0,
    viatico: float = 0,
    anticipo: float = 0
):
    # Proporcionalidad del sueldo base según días trabajados
    proportional_base = (base_salary / 30) * days_worked
    
    # Haberes Imponibles
    total_imponible = proportional_base + gratification + bono_responsabilidad + horas_extras_amount
    
    # Descuentos
    afp_rate = AFP_RATES.get(afp_name, 0.1144) # Default to Capital rate if not found
    afp_discount = total_imponible * afp_rate
    
    health_rate = 0.07 # Fonasa/Isapre minimo legal
    health_discount = total_imponible * health_rate
    
    cesantia_rate = 0.006 # Seguro Cesantía trabajador indefinido
    cesantia_discount = total_imponible * cesantia_rate
    
    total_descuentos = afp_discount + health_discount + cesantia_discount
    
    # Haberes No Imponibles
    total_no_imponible = colacion + movilizacion + viatico
    
    # Totales
    total_haberes = total_imponible + total_no_imponible
    alcance_liquido = total_haberes - total_descuentos
    liquido_a_pagar = alcance_liquido - anticipo
    
    return {
        "base_salary": round(base_salary),
        "proportional_base": round(proportional_base),
        "days_worked": days_worked,
        "gratification": round(gratification),
        "bono_responsabilidad": round(bono_responsabilidad),
        "horas_extras_amount": round(horas_extras_amount),
        "total_imponible": round(total_imponible),
        
        "colacion": round(colacion),
        "movilizacion": round(movilizacion),
        "viatico": round(viatico),
        "total_no_imponible": round(total_no_imponible),
        
        "total_haberes": round(total_haberes),
        
        "afp_discount": round(afp_discount),
        "health_discount": round(health_discount),
        "cesantia_discount": round(cesantia_discount),
        "total_descuentos": round(total_descuentos),
        
        "alcance_liquido": round(alcance_liquido),
        "anticipo": round(anticipo),
        "liquido_a_pagar": round(liquido_a_pagar)
    }
