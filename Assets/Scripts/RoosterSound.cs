using UnityEngine;

[RequireComponent(typeof(AudioSource))]
public class RoosterSound : MonoBehaviour
{
    private AudioSource som;

    void Awake()
    {
        som = GetComponent<AudioSource>();
    }

    void Update()
    {
        if (Input.GetKeyDown(KeyCode.C))
            Cacarejar();
    }

    public void Cacarejar()
    {
        som.Play();
    }
}