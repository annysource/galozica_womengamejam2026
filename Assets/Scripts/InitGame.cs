using UnityEngine;

public class InitGame : MonoBehaviour
{
    [SerializeField] private FluxoDeTelas fluxoDeTelas;

    // Start is called once before the first execution of Update after the MonoBehaviour is created
    void Start()
    {
        fluxoDeTelas.AbrirMenu();
    }

    // Update is called once per frame
    void Update()
    {
        
    }
}
