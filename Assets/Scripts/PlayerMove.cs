using System.Collections;
using System.Collections.Generic;
using System.IO;
using UnityEngine;

public class PlayerMove : MonoBehaviour {

    /*Vector3 velocity;
    float acceleration = 10;
    float maxSpeed = 10;
    Vector3 direction = Vector3.zero;
    Vector3 currentVelocity;*/

    //public float Speed;
    // Rigidbody Rig;
    public Transform modeloVisual;
    public CharacterController controller;
    public Animator animator;
    public float speed = 12f;
    public float px, pz, x, z;
    private string PositionFilePath => Path.Combine (Application.persistentDataPath, "PlayerPosition.json");

    void Start () {
        //  controller = GetComponent<CharacterController> ();
        //   Rig = GetComponent<Rigidbody> ();
        LoadFromJason ();

    }

    // Update is called once per frame
    void Update () {
        x = Input.GetAxis ("Horizontal");
        z = Input.GetAxis ("Vertical");
        Vector3 move = transform.right * x + transform.forward * z;
        controller.Move (move * speed * Time.deltaTime);

        if (animator != null)
        {
            animator.SetBool ("Andando", z > 0.1f);
        }
        if (move.sqrMagnitude > 0.01f)
        {
            modeloVisual.rotation = Quaternion.LookRotation(move);
        }

        //  px = transform.position.x;
        //    py = transform.position.y;
        //  pz = transform.position.z;

        // Vector3 Position = new Vector3 (Input.GetAxisRaw ("Horizontal"), 0, Input.GetAxisRaw ("Vertical"));
        // Rig.velocity = Position * Speed;
        /* float horizontalInput = Input.GetAxisRaw ("Horizontal");
        float verticalInput = Input.GetAxisRaw ("Vertical");

        direction = new Vector3 (horizontalInput, 0, verticalInput).normalized;

         // velocity += acceleration * Time.deltaTime;
         velocity = Vector3.SmoothDamp (velocity, direction * maxSpeed, ref currentVelocity, maxSpeed / acceleration);
         transform.position += velocity * Time.deltaTime;*/

    }
    public void PassaPositionPlayer () {
        px = transform.position.x;
        pz = transform.position.z;
        PlayerPosition data = new PlayerPosition ();
        data.x = px;
        data.z = pz;

        string json = JsonUtility.ToJson (data, true);
        Directory.CreateDirectory (Application.persistentDataPath);
        File.WriteAllText (PositionFilePath, json);
    }

    public void LoadFromJason () {
        if (!File.Exists (PositionFilePath)) {
            Debug.Log ("Nenhuma posição salva encontrada. Usando a posição definida na cena.");
            return;
        }

        string json = File.ReadAllText (PositionFilePath);
        PlayerPosition data = JsonUtility.FromJson<PlayerPosition> (json);
        if (data == null) {
            throw new InvalidDataException ("O arquivo de posição do jogador está vazio ou inválido: " + PositionFilePath);
        }

        px = data.x;
        pz = data.z;

        Vector3 pos = new Vector3 (px, 1.71f, pz);
        transform.position = pos;

    }

}