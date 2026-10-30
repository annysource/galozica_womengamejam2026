using UnityEditor;
using UnityEngine;

public static class GaloZicaReimportURP
{
    [MenuItem("Tools/Galo Zica/Reimportar recursos URP")]
    public static void Reimportar()
    {
        string[] paths = {
            "Packages/com.unity.render-pipelines.universal/Shaders/AutodeskInteractive/AutodeskInteractive.shadergraph",
            "Packages/com.unity.render-pipelines.core/Editor/Lighting/ProbeVolume/VirtualOffset/TraceVirtualOffset.urtshader"
        };
        foreach (string path in paths)
        {
            try
            {
                AssetDatabase.ImportAsset(path,
                    ImportAssetOptions.ForceUpdate |
                    ImportAssetOptions.ForceSynchronousImport);
                var type = AssetDatabase.GetMainAssetTypeAtPath(path);
                var importer = AssetImporter.GetAtPath(path);
                string result = "[Galo Zica] " + path +
                    "\nTipo: " + (type == null ? "NULL" : type.FullName) +
                    "\nImportador: " + (importer == null ? "NULL" : importer.GetType().FullName);
                if (type == null || type == typeof(DefaultAsset))
                    Debug.LogError(result);
                else
                    Debug.Log(result);
            }
            catch (System.Exception e)
            {
                Debug.LogError("[Galo Zica] Falha em " + path + "\n" + e);
            }
        }
    }
}
