using System;
using System.Collections;
using UnityEngine;

public class CameraFollow : MonoBehaviour
{
    public Camera camera;
    public Transform cameraTarget;


    public Vector3 cameraOffset = new Vector3(-10f, 30f, -10f);
    private float smoothTime = 0.25f;
    private Vector3 velocity = Vector3.zero;
    [Range(0f, 0.5f)] private float bottomMargin = 0.15f;

    private Vector3 groundOffset = new Vector3(-10f, 30f, -10f);
    private Vector3 platformOffset = new Vector3(0f, 0f, -10f);

    /// <summary>
    /// floorToPlatform is updated by PlayerTagUpdater attatched to the player object with a collision enter function.
    /// When more platform Tag types are added that aren't OneWayPlatform, they must be added in PlayerTagUpdater for the camera to work.
    /// </summary>
    public bool floorToPlatform = false;
    private Coroutine FTPHolder = null;
    public bool platformToFloor = false;
    private Coroutine PTFHolder = null;



    

    public void LateUpdate()
    {
        if (floorToPlatform && FTPHolder == null)
        {
            floorToPlatform = false;
            FTPHolder = StartCoroutine(floorToPlatformRoutine());
        }
        if (platformToFloor && PTFHolder == null)
        {
            platformToFloor = false;
            PTFHolder = StartCoroutine(platformToFloorRoutine());
        }
        Vector3 targetPosition = cameraTarget.position + cameraOffset;
        Vector3 nextPosition = Vector3.SmoothDamp(transform.position, targetPosition, ref velocity, smoothTime);
        
        float maxCameraY = cameraTarget.position.y
            + camera.orthographicSize * (1f - 2f * bottomMargin);

        if (nextPosition.y > maxCameraY)
        {
            nextPosition.y = maxCameraY;
            velocity.y = 0f;
        }

        transform.position = nextPosition;
    }

    public IEnumerator floorToPlatformRoutine()
    {
        while (cameraOffset.y > platformOffset.y)
        {
            cameraOffset = new Vector3 (cameraOffset.x, cameraOffset.y - 0.1f, cameraOffset.z);
            yield return null;
        }

        cameraOffset = new Vector3(cameraOffset.x, platformOffset.y, cameraOffset.z);
        FTPHolder = null;
        
    }

    public IEnumerator platformToFloorRoutine()
    {
        while (cameraOffset.y < groundOffset.y)
        {
            cameraOffset = new Vector3 (cameraOffset.x, cameraOffset.y + 0.1f, cameraOffset.z);
            yield return null;
        }

        cameraOffset = new Vector3(cameraOffset.x, groundOffset.y, cameraOffset.z);
        PTFHolder = null;
    }
}