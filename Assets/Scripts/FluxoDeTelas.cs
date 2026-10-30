using System.Collections;
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
    private bool aguardandoVitoria;

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

    public void AguardarAudioEVencer(AudioSource audio)
    {
        if (audio == null)
        {
            Debug.LogError("FluxoDeTelas precisa de um AudioSource para aguardar antes da vitória.", this);
            return;
        }

        if (!aguardandoVitoria)
            StartCoroutine(AguardarAudioEVencerCoroutine(audio));
    }

    private IEnumerator AguardarAudioEVencerCoroutine(AudioSource audio)
    {
        aguardandoVitoria = true;
        yield return null;

        while (audio.isPlaying)
            yield return null;

        Vencer();
    }

    // Métodos para conectar aos botões pelo Inspector.
    public void AbrirMenu() => MudarEstado(Estado.MenuPrincipal);
    public void AbrirCreditos() => MudarEstado(Estado.Creditos);
    public void Jogar() => MudarEstado(Estado.Play);
    public void Vencer() => MudarEstado(Estado.VitoriaDaClasseTrabalhadora);
}