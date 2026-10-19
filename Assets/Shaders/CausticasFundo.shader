Shader "WGJ/Agua/CausticasFundo"
{
    Properties
    {
        [NoScaleOffset] _Caustics ("Textura Causticas.png", 2D) = "black" {}
        _Color ("Cor da luz", Color) = (0.65, 0.92, 0.80, 1)
        _Intensity ("Intensidade", Range(0, 2)) = 0.45
        _Scale ("Repeticoes por metro", Range(0.05, 3)) = 0.35
        _Speed ("Velocidade", Range(0, 2)) = 0.3
    }
    SubShader
    {
        Tags { "RenderPipeline"="UniversalPipeline" "RenderType"="Transparent" "Queue"="Transparent-10" }
        Pass
        {
            Tags { "LightMode"="SRPDefaultUnlit" }
            Blend One One
            ZWrite Off
            Cull Off
            HLSLPROGRAM
            #pragma vertex Vert
            #pragma fragment Frag
            #pragma multi_compile_instancing
            #pragma multi_compile_fog
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            TEXTURE2D(_Caustics);
            SAMPLER(sampler_Caustics);
            CBUFFER_START(UnityPerMaterial)
                half4 _Color;
                half _Intensity;
                float _Scale;
                float _Speed;
            CBUFFER_END
            struct Attributes
            {
                float4 positionOS : POSITION;
                UNITY_VERTEX_INPUT_INSTANCE_ID
            };
            struct Varyings
            {
                float4 positionCS : SV_POSITION;
                float2 uv : TEXCOORD0;
                half fog : TEXCOORD1;
                UNITY_VERTEX_OUTPUT_STEREO
            };
            Varyings Vert(Attributes input)
            {
                Varyings output = (Varyings)0;
                UNITY_SETUP_INSTANCE_ID(input);
                UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO(output);
                float3 positionWS = TransformObjectToWorld(input.positionOS.xyz);
                output.positionCS = TransformWorldToHClip(positionWS);
                output.uv = positionWS.xz * _Scale;
                output.fog = ComputeFogFactor(output.positionCS.z);
                return output;
            }
            half4 Frag(Varyings input) : SV_Target
            {
                UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX(input);
                float t = _Time.y * _Speed;
                float2 uv = input.uv;
                // Two scrolling layers and a small continuous warp break the static grid.
                float2 warp = sin(uv.yx * 4.0 + float2(t, -t * 0.8)) * 0.018;
                half a = SAMPLE_TEXTURE2D(_Caustics, sampler_Caustics,
                    uv + warp + float2(t * 0.025, t * 0.018)).r;
                float2 rotated = float2(uv.x * 0.8 + uv.y * 0.6, -uv.x * 0.6 + uv.y * 0.8);
                half b = SAMPLE_TEXTURE2D(_Caustics, sampler_Caustics,
                    rotated * 1.13 - warp + float2(-t * 0.016, t * 0.023)).r;
                half light = (a + b) * 0.5h;
                half3 color = _Color.rgb * light * _Intensity;
                color = MixFogColor(color, half3(0, 0, 0), input.fog);
                return half4(color, 0);
            }
            ENDHLSL
        }
    }
    Fallback Off
}
