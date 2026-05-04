package com.burak.belediyeapp.service.ai;

import com.burak.belediyeapp.entity.Report;
import com.burak.belediyeapp.repository.IReportCategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.stream.Collectors;

/**
 * Google Gemini — öncelik, özet, kategori uyumu ve önerilen kategori.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GeminiService {

    @Value("${app.ai.gemini.api-key:}")
    private String apiKey;

    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

    private final RestClient restClient = RestClient.create();
    private final IReportCategoryRepository categoryRepository;

    public AIAnalysisResult analyzeReport(Report report) {
        if (apiKey == null || apiKey.isBlank() || apiKey.equals("your-gemini-api-key")) {
            log.warn("Gemini API Key eksik. AI analizi atlanıyor.");
            return null;
        }

        String categoryOptions = categoryRepository.findAllByActiveTrue().stream()
                .map(c -> c.getName())
                .collect(Collectors.joining(", "));

        String prompt = String.format(
                """
                Sen İstanbul Büyükşehir Belediyesi ihbar analiz asistanısın. Aşağıdaki ihbarı analiz et.
                Geçerli kategori adları (yalnızca bunlardan birini öner): [%s]
                Mevcut seçilen kategori: %s
                JSON döndür (İngilizce anahtarlar):
                {"priority":"LOW|MEDIUM|HIGH|CRITICAL","summary":"max 25 kelime Türkçe","is_category_correct":true/false,"suggested_category_name":"yalnızca listeden bir ad veya mevcut kategori"}
                Başlık: %s
                Açıklama: %s
                """,
                categoryOptions,
                report.getCategory().getName(),
                report.getTitle(),
                report.getDescription()
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
            log.error("AI analiz hatası: ", e);
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
                    analysis.optBoolean("is_category_correct", true),
                    analysis.optString("suggested_category_name", "")
            );
        } catch (Exception e) {
            log.error("AI yanıt ayrıştırma hatası: ", e);
            return null;
        }
    }

    public record AIAnalysisResult(
            String priority,
            String summary,
            boolean isCategoryCorrect,
            String suggestedCategoryName
    ) {}
}
