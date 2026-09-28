from decimal import Decimal


def evaluate_progression(sets_data, target_reps_min, target_reps_max,
                         current_weight_kg, increment_kg):
    """
    sets_data: lista de dicts [{'reps_done': int, 'weight_used_kg': Decimal}, ...]
    """
    if not sets_data:
        return {
            'ready_to_increase': False,
            'suggested_weight_kg': Decimal(str(current_weight_kg)),
            'reason': 'Sin series registradas',
        }

    all_reached_min = all(s['reps_done'] >= target_reps_min for s in sets_data)
    last_set = sets_data[-1]
    last_reached_max = last_set['reps_done'] >= target_reps_max

    if all_reached_min and last_reached_max:
        new_weight = Decimal(str(current_weight_kg)) + Decimal(str(increment_kg))
        return {
            'ready_to_increase': True,
            'suggested_weight_kg': new_weight,
            'reason': (
                f'¡Felicidades! Completaste {last_set["reps_done"]} reps en la última serie. '
                f'Sube de {current_weight_kg}kg a {new_weight}kg.'
            ),
        }

    return {
        'ready_to_increase': False,
        'suggested_weight_kg': Decimal(str(current_weight_kg)),
        'reason': 'Aún no alcanzas el tope del rango en la última serie.',
    }