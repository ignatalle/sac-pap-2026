"""
SAC-PAP 2026 — Script de importación
Importa los datos del Excel a Supabase

Uso:
  pip install openpyxl supabase python-dotenv
  python importar_excel.py

Variables de entorno necesarias (.env):
  SUPABASE_URL=https://xxxx.supabase.co
  SUPABASE_KEY=tu-service-role-key
"""

import os
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")  # usar service_role key para bypass RLS

def excel_serial_a_fecha(serial):
    """Convierte número serial de Excel a string ISO"""
    try:
        s = int(float(str(serial).strip()))
        if s <= 0: return None
        d = datetime(1899, 12, 30) + timedelta(days=s)
        return d.strftime('%Y-%m-%d')
    except:
        return None

def safe_int(v, default=0):
    try: return int(float(str(v).strip()))
    except: return default

def main():
    # Cargar el JSON generado previamente
    script_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(script_dir, 'tareas.json')
    
    with open(json_path, 'r', encoding='utf-8') as f:
        tareas = json.load(f)
    
    print(f"Cargando {len(tareas)} tareas...")
    
    # Conectar a Supabase
    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Limpiar tabla existente
    client.table('tareas_pap').delete().neq('id', 0).execute()
    print("Tabla limpiada")
    
    # Insertar en lotes de 50
    batch_size = 50
    for i in range(0, len(tareas), batch_size):
        batch = tareas[i:i+batch_size]
        # Mapear campos al schema de Supabase
        rows = []
        for t in batch:
            rows.append({
                'id': t['id'],
                'direccion': t['direccion'],
                'actividad': t['actividad'],
                'tarea': t['tarea'],
                'observaciones': t['observaciones'],
                'termino_pap_texto': t['termino_pap_texto'],
                'fecha_pap_inicio': t['fecha_pap_inicio'],
                'fecha_pap_fin': t['fecha_pap_fin'],
                'tipo_termino': t['tipo_termino'] or 'fecha',
                'fecha_limite_efectiva': t['fecha_limite_efectiva'],
                'dias_autoimpuestos': t['dias_autoimpuestos'] or 10,
                'dias_preparacion': t['dias_preparacion'] or 7,
                'porcentaje_avance': t['porcentaje_avance'] or 0,
                'dependencia': t['dependencia'],
                'documento': t['documento'] or 'REDOAPE',
                'estado': t['estado'],
                'dias_restantes': t['dias_restantes'],
                'responsable': t['responsable'],
                'prioridad': t['prioridad'] or 'NORMAL',
            })
        
        client.table('tareas_pap').insert(rows).execute()
        print(f"  Insertadas {min(i+batch_size, len(tareas))}/{len(tareas)}")
    
    print(f"\n✅ Importación completa — {len(tareas)} tareas en Supabase")

if __name__ == '__main__':
    main()
