# workouts/progression.py
"""
Lógica de progresión automática BLACK GYM.

Reglas:
- Si el cliente hace >= target_reps_max (15 por defecto) en TODAS las series
  con buena técnica -> ready_to_increase = True.
- Semana de POTENCIA: si hace > 6 reps, se avisa que faltó peso.
- Semana de DESCARGA: nunca se sube peso (se mantiene).
"""

from decimal import Decimal


def evaluate_progression(sets_data, target_reps_min, target_reps_max,
                          current_weight_kg, increment_kg,
                          phase='impacto'):
    """
    sets_data: lista de dicts {'reps_done': int, 'weight_used_kg': Decimal}
    phase: 'impacto' | 'descarga' | 'potencia'
    """
    if not sets_data:
        return {
            'ready_to_increase': False,
            'suggested_weight_kg': Decimal(str(current_weight_kg)),
            'reason': 'No hay series registradas.',
        }

    reps = [s['reps_done'] for s in sets_data]
    min_reps = min(reps)
    max_reps = max(reps)

    # --- Semana de DESCARGA: nunca subir ---
    if phase == 'descarga':
        return {
            'ready_to_increase': False,
            'suggested_weight_kg': Decimal(str(current_weight_kg)),
            'reason': 'Semana de descarga: mantén la carga y entrena lejos del fallo.',
        }

    # --- Semana de POTENCIA: objetivo 6 reps máx ---
    if phase == 'potencia':
        if max_reps > 6:
            return {
                'ready_to_increase': True,
                'suggested_weight_kg': Decimal(str(current_weight_kg)) + Decimal(str(increment_kg)),
                'reason': (
                    f'Semana de potencia: hiciste {max_reps} reps (máx 6). '
                    f'Faltó peso. Sube a {float(current_weight_kg) + float(increment_kg)} kg.'
                ),
            }
        if max_reps < 4 and min_reps < 4:
            return {
                'ready_to_increase': False,
                'suggested_weight_kg': Decimal(str(current_weight_kg)),
                'reason': 'Semana de potencia: mantén la carga, la técnica manda.',
            }
        return {
            'ready_to_increase': False,
            'suggested_weight_kg': Decimal(str(current_weight_kg)),
            'reason': f'Semana de potencia: {max_reps} reps dentro del rango (4-6). Mantén.',
        }

    # --- Semanas de IMPACTO: subir si TODAS las series llegaron al techo ---
    if min_reps >= target_reps_max:
        return {
            'ready_to_increase': True,
            'suggested_weight_kg': Decimal(str(current_weight_kg)) + Decimal(str(increment_kg)),
            'reason': (
                f'Llegaste a {min_reps}-{max_reps} reps (techo {target_reps_max}). '
                f'Sube a {float(current_weight_kg) + float(increment_kg)} kg.'
            ),
        }

    if max_reps < target_reps_min:
        return {
            'ready_to_increase': False,
            'suggested_weight_kg': Decimal(str(current_weight_kg)),
            'reason': (
                f'Solo {max_reps} reps (mínimo {target_reps_min}). '
                f'Considera bajar un poco la carga.'
            ),
        }

    return {
        'ready_to_increase': False,
        'suggested_weight_kg': Decimal(str(current_weight_kg)),
        'reason': f'{min_reps}-{max_reps} reps: mantén la carga y busca más reps.',
    }