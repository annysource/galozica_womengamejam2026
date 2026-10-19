import sys
from pathlib import Path

import bpy


def load_validator():
    """Localiza naming.py ao lado do script salvo no Blender."""
    space = bpy.context.space_data
    text = getattr(space, "text", None)

    if text is None or not text.filepath:
        raise RuntimeError(
            "Salve este texto como asset_preparer.py antes de executar."
        )

    script_folder = Path(bpy.path.abspath(text.filepath)).resolve().parent
    naming_file = script_folder / "naming.py"

    if not naming_file.is_file():
        raise RuntimeError(
            f"Arquivo naming.py não encontrado em: {script_folder}"
        )

    # Carrega o arquivo local novamente a cada execução no Blender.
    import importlib.util

    spec = importlib.util.spec_from_file_location(
        "asset_preparer_naming", naming_file
    )

    if spec is None or spec.loader is None:
        raise RuntimeError("Não foi possível carregar naming.py.")

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    return module.validate_inputs


ASSET_NAME = "galinha"
VERSION = 1
CATEGORY = "Characters"

OUTPUT_ROOT = Path.home() / "WGJ_Exports"


def main():
    """Valida os dados e cria a estrutura de entrega."""
    try:
        validate_inputs = load_validator()
        validate_inputs(ASSET_NAME, VERSION, CATEGORY)

        version_label = f"v{VERSION:03d}"
        filename = f"{ASSET_NAME}_{version_label}.fbx"

        asset_folder = (
            OUTPUT_ROOT / CATEGORY / ASSET_NAME / version_label
        )

        try:
            asset_folder.mkdir(parents=True, exist_ok=False)
        except FileExistsError:
            print(
                f"\nERRO: o destino já existe: {asset_folder}\n"
                "Escolha outra versão para preservar a entrega anterior."
            )
            return

        models_folder = asset_folder / "Models"
        textures_folder = asset_folder / "Textures"

        models_folder.mkdir()
        textures_folder.mkdir()

        print("\nOK: estrutura criada.")
        print("Pasta da entrega:", asset_folder)
        print("Pasta de modelos:", models_folder)
        print("Pasta de texturas:", textures_folder)
        print("Destino previsto do FBX:", models_folder / filename)
        print("O FBX ainda não foi exportado.")

    except (ValueError, RuntimeError) as error:
        print(f"\nERRO: {error}")

    except OSError as error:
        print(f"\nERRO de acesso ao disco: {error}")
        print(
            "A estrutura pode estar incompleta. "
            "Confira o destino antes de tentar novamente."
        )

    except Exception:
        # Mostra detalhes de falhas inesperadas para facilitar o debugging.
        import traceback

        print("\nERRO inesperado. Detalhes:")
        traceback.print_exc(file=sys.stdout)


if __name__ == "__main__":
    main()