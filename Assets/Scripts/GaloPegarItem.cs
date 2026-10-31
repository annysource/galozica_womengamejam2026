using UnityEngine;

public class GaloPegarItem : MonoBehaviour
{
    public enum ItemType { Nenhum, Baseado, Cigarro, Batata }

    public Transform pontoBico;
    public Transform pontoSoltar;
    public float alcance = 1.5f;
    public LayerMask camadaItens;

    public ItemType tipoCarregado = ItemType.Nenhum;

    private Rigidbody itemProximo;
    private Rigidbody itemCarregado;
    private bool baseadoPegoPelaPrimeiraVez;

    public Animator animator;

    void Update()
    {
        itemProximo = null;

        // Procura o item mais próximo.
        if (itemCarregado == null)
        {
            float menorDistancia = float.PositiveInfinity;

            foreach (Collider col in Physics.OverlapSphere(
                pontoBico.position,
                alcance,
                camadaItens,
                QueryTriggerInteraction.Ignore))
            {
                Rigidbody item = col.attachedRigidbody;

                if (item == null) continue;

                float distancia = Vector3.Distance(
                    pontoBico.position,
                    col.ClosestPoint(pontoBico.position)
                );

                if (distancia < menorDistancia)
                {
                    menorDistancia = distancia;
                    itemProximo = item;
                }
            }
        }

        if (!Input.GetKeyDown(KeyCode.E)) return;

        if (itemCarregado != null)
            Soltar();
        else if (itemProximo != null)
            Pegar();

        if (Input.GetKeyDown(KeyCode.E) && animator != null)
        {
            animator.SetTrigger("Ciscar");
        }
    }

    void Pegar()
    {
        itemCarregado = itemProximo;
        if (animator != null)
            animator.SetTrigger("Ciscar");

        tipoCarregado = ObterTipoItem(itemCarregado.transform);
        if (tipoCarregado == ItemType.Baseado)
            baseadoPegoPelaPrimeiraVez = true;

        Debug.Log($"Item pego: {itemCarregado.name}; tipo identificado: {tipoCarregado}.", itemCarregado);

        itemCarregado.isKinematic = true;
        itemCarregado.detectCollisions = false;

        itemCarregado.transform.SetParent(pontoBico);
        itemCarregado.transform.localPosition = Vector3.zero;
        itemCarregado.transform.localRotation = Quaternion.identity;
    }

    ItemType ObterTipoItem(Transform raizItem)
    {
        ItemType tipo = TipoPelaTag(raizItem.tag);
        if (tipo != ItemType.Nenhum)
            return tipo;

        foreach (Transform filho in raizItem.GetComponentsInChildren<Transform>(true))
        {
            if (filho == raizItem)
                continue;

            tipo = TipoPelaTag(filho.tag);
            if (tipo != ItemType.Nenhum)
                return tipo;
        }

        return ItemType.Nenhum;
    }

    ItemType TipoPelaTag(string tag)
    {
        return tag switch
        {
            "Baseado" => ItemType.Baseado,
            "Semente" => ItemType.Semente,
            "Galho" => ItemType.Galho,
            _ => ItemType.Nenhum
        };
    }

    void Soltar()
    {
        Debug.Log($"Item solto: {itemCarregado.name}; tipo antes de limpar: {tipoCarregado}.", itemCarregado);

        itemCarregado.transform.SetParent(null);
        itemCarregado.transform.position = pontoSoltar.position;

        itemCarregado.detectCollisions = true;
        itemCarregado.useGravity = true;
        itemCarregado.isKinematic = false;

        itemCarregado = null;
        tipoCarregado = ItemType.Nenhum;
    }

    void OnGUI()
    {
        string texto = itemCarregado != null
            ? "E — Soltar"
            : itemProximo != null || !baseadoPegoPelaPrimeiraVez
                ? "E — Pegar"
                : "";

        if (texto == "") return;

        GUI.Box(
            new Rect(Screen.width / 2f - 100, Screen.height - 80, 200, 40),
            texto
        );
    }
}