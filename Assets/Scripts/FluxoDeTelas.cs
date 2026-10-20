using UnityEngine;

public class FluxoDeTelas : MonoBehaviour
{
    public enum Estado
    {
        MenuPrincipal,
        Creditos,
        Play,
        VitoriaDaClasseTrabalhadora
    }

    [Header("Painéis das telas")]
    [SerializeField] private GameObject menuPrincipal;
    [SerializeField] private GameObject creditos;
    [SerializeField] private GameObject play;
    [SerializeField] private GameObject vitoria;

    public Estado EstadoAtual { get; private set; }

    private void Start()
    {
        MudarEstado(Estado.MenuPrincipal);
    }

    public void MudarEstado(Estado novoEstado)
    {
        EstadoAtual = novoEstado;

        menuPrincipal.SetActive(novoEstado == Estado.MenuPrincipal);
        creditos.SetActive(novoEstado == Estado.Creditos);
        play.SetActive(novoEstado == Estado.Play);
        vitoria.SetActive(
            novoEstado == Estado.VitoriaDaClasseTrabalhadora
        );
    }

    // Métodos para conectar aos botões pelo Inspector.
    public void AbrirMenu() => MudarEstado(Estado.MenuPrincipal);
    public void AbrirCreditos() => MudarEstado(Estado.Creditos);
    public void Jogar() => MudarEstado(Estado.Play);
    public void Vencer() => MudarEstado(Estado.VitoriaDaClasseTrabalhadora);
}