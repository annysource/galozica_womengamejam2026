using UnityEngine;

public class ManifestacaoAudio : MonoBehaviour
{
    public AudioSource audioManifestacao;
    public AudioSource audioVitoria;
    [SerializeField] private FluxoDeTelas fluxoDeTelas;

    private bool concluida;

    void Start()
    {
        concluida = false;
    }

    public void ConcluirMissao()
    {
        if (concluida) return;
        concluida = true;
        audioVitoria.Play();
        audioManifestacao.mute = true;
        
        fluxoDeTelas.AguardarAudioEVencer(audioVitoria);
       //teste de audio, commit so pra ativar recomendacao
    }


    
}