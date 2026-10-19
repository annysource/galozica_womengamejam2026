using UnityEngine;
using UnityEngine.Events;

public class Manifestacao : MonoBehaviour
{
    public UnityEvent aoConcluirMissao;

    private RoosterSound galoNaArea;
    private bool concluida;
    public GameObject textoMissao;
    public UIMission uiMission;

    void Start()
    {
        textoMissao.SetActive(false);
        if (uiMission == null)
            uiMission = FindObjectOfType<UIMission>();

        if (uiMission == null)
            Debug.LogError("Manifestacao precisa de uma referência a UIMission para exibir o popup.", this);
    }

    void OnTriggerEnter(Collider other)
    {
        RoosterSound galo = other.GetComponentInParent<RoosterSound>();

        if (galo != null)
            galoNaArea = galo;
    }

    void OnTriggerExit(Collider other)
    {
        if (other.GetComponentInParent<RoosterSound>() == galoNaArea)
        {
            textoMissao.SetActive(false);
            galoNaArea = null;
        }
    }

    void Update()
    {
        if (galoNaArea == null || !Input.GetKeyDown(KeyCode.C) || concluida)
            return;

        textoMissao.SetActive(true);
        concluida = true;
        Debug.Log("Missão da manifestação concluída!");

        if (uiMission != null)
            uiMission.ExibirMissaoConcluida();

        aoConcluirMissao.Invoke();
    }

    
}