using UnityEngine;

public class ManifestacaoAudio : MonoBehaviour
{
    public AudioSource audioManifestacao;
    public AudioSource audioVitoria;
  

    private bool concluida;

    void Start()
    {
        concluida = false;
    }

    public void ConcluirMissao()
    {
        if (concluida) return;
        concluida = true;

        audioManifestacao.mute = true;
        audioVitoria.Play();
        
       
    }


    
}