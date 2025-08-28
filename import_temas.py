import os
import re
import datetime

dir_path = 'e:\\OpoMelilla_2025\\Trae_AI\\Mi_IA_2025\\docs\\temas\\Temario\\Temas Bloque 3'
sql_file = 'e:\\OpoMelilla_2025\\Trae_AI\\Mi_IA_2025\\import_tema_adicional.sql'

importados = [
    'LA CONTITUCIÓN ESPAÑOLA 1978 (Títulos III, IV, V, VI Y VIII)',
    'Ley Orgánica 5_2005, de la Defensa Nacional',
    'Ley 40_2015. Régimen Jurídico del Sector Público',
    'Organización básica de las Fuerzas Armadas.'
]

with open(sql_file, 'w', encoding='utf-8') as f:
    bloque = 3
    filename = 'Tema 7. España y su participación en Misiones Internacionales.txt'
    filepath = os.path.join(dir_path, filename)
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as txt:
            descripcion = txt.read().replace("'", "''").replace('\n', '\\n')

        match = re.match(r'Tema (\d+)\. (.*)\.txt', filename)
        if match:
            numero = match.group(1)
            titulo = match.group(2).replace("'", "''")
            if titulo in importados:
                pass
            else:
                nivel_dificultad = 1
                posicion_x = 0
                posicion_y = 0
                posicion_z = 0
                color = '#FFFFFF'
                timestamp = int(datetime.datetime.now().timestamp())

                insert = f"INSERT INTO mdl_neuroopositor_temas (bloque, numero, titulo, descripcion, nivel_dificultad, posicion_x, posicion_y, posicion_z, color, timecreated, timemodified) VALUES ({bloque}, '{numero}', '{titulo}', '{descripcion}', {nivel_dificultad}, {posicion_x}, {posicion_y}, {posicion_z}, '{color}', {timestamp}, {timestamp});\n"
                f.write(insert)