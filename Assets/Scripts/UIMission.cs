using UnityEngine;

public class UIMission : MonoBehaviour
{
    private bool exibirMensagem;
    private float mensagemAte;

    public void ExibirMissaoConcluida()
    {
        exibirMensagem = true;
        mensagemAte = Time.time + 6f;
    }

    void OnGUI()
    {
        if (!exibirMensagem || Time.time >= mensagemAte)
            return;

        GUI.Box(
            new Rect(Screen.width / 2f - 200, 20, 400, 70),
            "Missão concluída!\nPróxima missão: encontre os pombos."
        );
    }
}
