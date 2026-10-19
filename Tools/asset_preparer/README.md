# Preparador de assets — WGJ

## Padrão de nomenclatura

### Nome do asset
- Usar letras minúsculas de a até z, sem acentos.
- Usar números quando necessário.
- Separar palavras com underscore (_).
- Começar com uma letra.
- Não usar espaços ou outros caracteres especiais.

Exemplos válidos:
- galinha
- galinha_principal
- edificio_01

Exemplos inválidos:
- Galinha
- galinha principal
- edifício_01
- ../galinha

### Versão
- Informar um número inteiro maior que zero.
- Usar no mínimo três dígitos no nome gerado.

Exemplos:
- 1 → v001
- 2 → v002
- 12 → v012

### Categoria
Escolher uma destas opções:
- Characters: personagens e animais.
- Props: objetos de cena.
- Environment: construções e elementos do cenário.

## Estrutura de saída

Cada exportação segue esta estrutura:

<Categoria>/<Nome>/<Versão>/
├── Models/
│   └── <Nome>_<Versão>.fbx
├── Textures/
└── report.json

Exemplo:

Characters/galinha/v001/
├── Models/
│   └── galinha_v001.fbx
├── Textures/
└── report.json

## Regra de proteção
Se a pasta da versão já existir, interromper a exportação.
A ferramenta não deve sobrescrever uma entrega anterior.