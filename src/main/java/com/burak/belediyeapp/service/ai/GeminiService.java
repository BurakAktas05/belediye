package com.burak.belediyeapp.service.ai;

import com.burak.belediyeapp.entity.Report;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

/**
 * Google Gemini AI Entegrasyon Servisi.
 * Gelen ihbarları otomatik analiz eder, özetler ve önceliklendirir.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GeminiService {

    @Value("${app.ai.gemini.api-key}")
    private String apiKey;

    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

    private final RestClient restClient = RestClient.create();

    /**
     * İhbarı asenkron olarak analiz eder.
     * Analiz sonuçlarını raporun description alanına veya ayrı bir meta alanına ekleyebilir.
     */
    public AIAnalysisResult analyzeReport(Report report) {
        if (apiKey == null || apiKey.equals("your-gemini-api-key")) {
            log.warn("Gemini API Key eksik. AI Analizi atlanıyor.");
            return null;
        }

        String prompt = String.format(
            "Sen bir belediye yönetim asistanısın. Aşağıdaki vatandaş ihbarını analiz et ve JSON formatında şu bilgileri ver: " +
            "'priority' (LOW, MEDIUM, HIGH, CRITICAL), 'summary' (max 20 kelime özet), 'is_category_correct' (true/false). " +
            "Kategori: %s, Başlık: %s, Açıklama: %s",
            report.getCategory().getName(), report.getTitle(), report.getDescription()
        );

        try {
            String requestBody = new JSONObject()
                .put("contents", new JSONArray().put(
                    new JSONObject().put("parts", new JSONArray().put(
                        new JSONObject().put("text", prompt)
                    ))
                ))
                .put("generationConfig", new JSONObject().put("response_mime_type", "application/json"))
                .toString();

            String response = restClient.post()
                .uri(GEMINI_API_URL + "?key=" + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(String.class);

            return parseResponse(response);

        } catch (Exception e) {
            log.error("AI Analiz hatası: ", e);
            return null;
        }
    }

    private AIAnalysisResult parseResponse(String response) {
        try {
            JSONObject json = new JSONObject(response);
            String text = json.getJSONArray("candidates")
                .getJSONObject(0)
                .getJSONObject("content")
                .getJSONArray("parts")
                .getJSONObject(0)
                .getString("text");

            JSONObject analysis = new JSONObject(text);
            return new AIAnalysisResult(
                analysis.optString("priority", "MEDIUM"),
                analysis.optString("summary", ""),
                analysis.optBoolean("is_category_correct", true)
            );
        } catch (Exception e) {
            log.error("AI Yanıt ayrıştırma hatası: ", e);
            return null;
        }
    }

    public record AIAnalysisResult(String priority, String summary, boolean isCategoryCorrect) {}
}
