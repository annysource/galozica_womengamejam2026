# Piscina clara: superficie transparente + luz no fundo

A referencia mostra fundo claro visivel e causticas. Esta aproximacao separa a superficie da agua da luz animada do fundo. Nao e simulacao fisica nem projecao de causticas real. Nao foi compilada ou testada visualmente no Unity neste ambiente.

## Importar

Copie PiscinaClara.shader, CausticasFundo.shader e Causticas.png para Assets/Shaders/Agua. Crie materiais novos, para nao manter os ajustes anteriores.

Selecione Causticas.png no Project: Texture Type Default; sRGB desmarcado; Wrap Mode Repeat; Filter Mode Bilinear; Generate Mip Maps marcado; Max Size 512. Clique Apply.

## Cena (escala em metros)

1. FundoPiscina: uma malha opaca com URP/Lit, cor areia clara ou azulejo claro, Metallic 0 e Smoothness 0.2. Exemplo: altura Y = 0.
2. LuzNoFundo: um Plane horizontal que cubra somente o fundo, em Y = 0.01 para nao piscar por sobreposicao. Crie material com WGJ/Agua/CausticasFundo, atribua Causticas.png ao campo Textura e aplique ao Plane. Desative Cast Shadows, remova MeshCollider se nao precisar. Este plano so adiciona luz e nao oculta o fundo.
3. SuperficieAgua: outro Plane em Y = 0.7 (ou altura real da agua). Material novo com WGJ/Agua/PiscinaClara. Desative Cast Shadows e remova MeshCollider se nao precisar. Ele deve substituir o Plane da agua antiga, nao ficar sobreposto a ele.

Mantenha fundo e planos horizontais; coordenadas XZ sao usadas para a animacao. Ajuste a escala de ambos para caberem no interior da piscina, sem atravessar as paredes. Nao troque o material do fundo por agua: ele precisa continuar opaco e visivel sob a superficie.

## Iluminacao e ajustes

Use Skybox, Environment Reflections e uma Directional Light. Uma Reflection Probe baked local e opcional para representar o entorno. Nao precisa de cameras de reflexo em tempo real, Depth Texture nem Opaque Texture.

Superficie: Tingimento da agua 0.18, Intensidade das ondulacoes 0.055 e Velocidade 0.55. Mais tingimento esconde o fundo; para agua muito clara, experimente 0.08 a 0.15.

LuzNoFundo: Intensidade 0.45, Repeticoes por metro 0.35 e Velocidade 0.3. Se o fundo ficar branco, reduza Intensidade. Se os desenhos estiverem grandes, aumente Repeticoes por metro.

Entre em Play e observe de cima e em angulo baixo. O fundo deve permanecer visivel de cima; reflexo aumenta em angulos rasantes. A luz no fundo deve se mover lentamente em linhas finas.

## Custo e limites

Dois planos com passes transparentes, mais caros que a agua opaca anterior. Uma textura 512x512, duas amostras de textura nas causticas, ondas procedurais na superficie e amostragem do ambiente. Sem refracao, deslocamento geometrico, profundidade automatica, sombras recebidas, luzes adicionais ou reflexos planares. A luz do fundo nao reage a sombras/objetos, paredes ou profundidade; e uma sobreposicao artistica para piscinas rasas. Transparencia pode apresentar ordenacao incorreta junto a outros objetos transparentes. Nao possui passes depth/depth normals/shadow caster.

Inclui macros de stereo; validar ambos os olhos e desempenho na build se usar XR. A imagem de referencia depende tambem de fundo, luz e camera: o shader isolado nao reproduz a fotografia.
