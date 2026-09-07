import random
import string

def generate_group_code(length: int = 6) -> str:
    """
    Generates a unique random uppercase alphanumeric group code.
    Example: 'KX72P9'
    """
    characters = string.ascii_uppercase + string.digits
    # Exclude ambiguous characters like '0', 'O', '1', 'I' if desired, but standard alphanumeric is fine.
    code = ''.join(random.choices(characters, k=length))
    return f"KX{code[2:]}" if len(code) >= 6 else code
