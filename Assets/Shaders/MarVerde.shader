Shader "WGJ/Agua/MarVerde"
{
    Properties
    {
        _BaseColor ("Cor principal", Color) = (0.015, 0.23, 0.15, 1)
        _EdgeColor ("Cor no horizonte", Color) = (0.16, 0.48, 0.34, 1)
        _HighlightColor ("Cor do brilho", Color) = (0.65, 0.88, 0.94, 1)
        _WaveScale ("Frequencia das ondulacoes", Range(0.1, 8)) = 1.5
        _Speed ("Velocidade", Range(0, 3)) = 0.8
        _RippleStrength ("Intensidade das ondulacoes", Range(0, 0.4)) = 0.12
        _HighlightStrength ("Intensidade do brilho", Range(0, 0.5)) = 0.12
    }
    SubShader
    {
        Tags { "RenderPipeline"="UniversalPipeline" "RenderType"="Opaque" "Queue"="Geometry" }
        Pass
        {
            Name "WaterReflective"
            Tags { "LightMode"="SRPDefaultUnlit" }
            Cull Off
            ZWrite On
            ZTest LEqual

            HLSLPROGRAM
            #pragma vertex Vert
            #pragma fragment Frag
            #pragma multi_compile_instancing
            #pragma multi_compile_fog
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"

            CBUFFER_START(UnityPerMaterial)
                half4 _BaseColor;
                half4 _EdgeColor;
                half4 _HighlightColor;
                float _WaveScale;
                float _Speed;
                half _RippleStrength;
                half _HighlightStrength;
            CBUFFER_END

            struct Attributes
            {
                float4 positionOS : POSITION;
                float3 normalOS : NORMAL;
                UNITY_VERTEX_INPUT_INSTANCE_ID
            };
            struct Varyings
            {
                float4 positionCS : SV_POSITION;
                float3 positionWS : TEXCOORD0;
                half3 normalWS : TEXCOORD1;
                half fogFactor : TEXCOORD2;
                UNITY_VERTEX_OUTPUT_STEREO
            };

            Varyings Vert(Attributes input)
            {
                Varyings output = (Varyings)0;
                UNITY_SETUP_INSTANCE_ID(input);
                UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO(output);
                output.positionWS = TransformObjectToWorld(input.positionOS.xyz);
                output.positionCS = TransformWorldToHClip(output.positionWS);
                output.normalWS = TransformObjectToWorldNormal(input.normalOS);
                output.fogFactor = ComputeFogFactor(output.positionCS.z);
                return output;
            }

            half4 Frag(Varyings input) : SV_Target
            {
                UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX(input);
                float2 p = input.positionWS.xz * _WaveScale;
                float t = _Time.y * _Speed;
                // Three crossing wave directions: disturb reflections, not surface color.
                half a = cos(dot(p, float2(1.0, 0.37)) + t);
                half b = cos(dot(p, float2(-0.63, 1.31)) - t * 0.83);
                half c = cos(dot(p, float2(1.71, -0.91)) + t * 1.17);
                half2 slope = half2(a - b * 0.63h + c * 0.43h,
                                    a * 0.37h + b * 1.31h - c * 0.23h);
                // Suppress fine ripples at distance to reduce shimmer.
                float footprint = max(length(ddx(p)), length(ddy(p)));
                half attenuation = rcp(1.0 + footprint * footprint * 4.0);
                half3 normal = normalize(input.normalWS +
                    half3(slope.x, 0, slope.y) * _RippleStrength * attenuation);
                half3 viewDirection = GetWorldSpaceNormalizeViewDir(input.positionWS);
                half facing = saturate(abs(dot(normal, viewDirection)));
                if (dot(normal, viewDirection) < 0) normal = -normal;
                half grazing = 1.0h - facing;
                half grazing2 = grazing * grazing;
                half fresnel = 0.02h + 0.98h * grazing2 * grazing2 * grazing;
                half3 reflectionDirection = reflect(-viewDirection, normal);
                half3 environment = GlossyEnvironmentReflection(
                    reflectionDirection, input.positionWS, 0.18h, 1.0h,
                    GetNormalizedScreenSpaceUV(input.positionCS));
                Light sun = GetMainLight();
                half3 illumination = max(SampleSH(normal), half3(0.035, 0.035, 0.035))
                    + sun.color * saturate(dot(normal, sun.direction)) * 0.35h;
                half3 waterColor = lerp(_BaseColor.rgb, _EdgeColor.rgb, grazing2 * 0.25h);
                half3 color = lerp(waterColor * illumination, environment, fresnel);
                half3 halfway = SafeNormalize(sun.direction + viewDirection);
                half nh = saturate(dot(normal, halfway));
                half specular = pow(nh, 128.0h) * saturate(dot(normal, sun.direction));
                color += sun.color * _HighlightColor.rgb * specular * _HighlightStrength * 4.0h;
                color = MixFog(color, input.fogFactor);
                return half4(color, 1);
            }
            ENDHLSL
        }
    }
    Fallback Off
}
