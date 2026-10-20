using UnityEngine;

public class UIMission : MonoBehaviour
{
    [SerializeField] private FluxoDeTelas fluxoDeTelas;

    private bool exibirMensagem;
    private bool vitoriaAcionada;
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
            "Missão concluída!\n"
        );

        if (!vitoriaAcionada)
        {
            fluxoDeTelas.Vencer();
            vitoriaAcionada = true;
        }
    }
}
