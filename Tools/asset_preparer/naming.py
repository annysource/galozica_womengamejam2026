import re

VALID_CATEGORIES = {"Characters", "Props", "Environment"}


def validate_inputs(asset_name, version, category):
    """Valida nome, versão e categoria do asset."""
    if not isinstance(asset_name, str) or not re.fullmatch(
        r"[a-z][a-z0-9_]*", asset_name
    ):
        raise ValueError(
            "Nome inválido: comece com letra minúscula e use "
            "somente letras sem acentos, números e underscore."
        )

    if type(version) is not int or version < 1:
        raise ValueError(
            "Versão inválida: use um inteiro maior que zero."
        )

    if category not in VALID_CATEGORIES:
        raise ValueError(
            "Categoria inválida: use Characters, Props ou Environment."
        )