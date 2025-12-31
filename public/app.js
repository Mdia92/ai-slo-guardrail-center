document.addEventListener('DOMContentLoaded', () => {
    // Input Elements
    const userIdInput = document.getElementById('userIdInput');
    const promptInput = document.getElementById('promptInput');
    const sendButton = document.getElementById('sendButton');
    
    // Display Elements
    const errorBanner = document.getElementById('errorBanner');
    const responsePreview = document.getElementById('responsePreview');
    const responseTextDisplay = document.getElementById('responseTextDisplay');
    const jsonPanel = document.getElementById('jsonPanel');
    const rawJsonOutput = document.getElementById('rawJsonOutput');

    // Metrics Elements
    const metricLatency = document.getElementById('metricLatency');
    const metricTokensIn = document.getElementById('metricTokensIn');
    const metricTokensOut = document.getElementById('metricTokensOut');
    const metricModel = document.getElementById('metricModel');

    // Quality Elements
    const qualityScoreVal = document.getElementById('qualityScoreVal');
    const qualityPill = document.getElementById('qualityPill');

    // Safety Elements
    const badgeHallucination = document.getElementById('badgeHallucination');
    const badgeInjection = document.getElementById('badgeInjection');
    const badgeUnsafe = document.getElementById('badgeUnsafe');

    sendButton.addEventListener('click', async () => {
        const prompt = promptInput.value.trim();
        const userId = userIdInput.value.trim();

        if (!prompt) {
            alert('Please enter a prompt.');
            return;
        }

        // Reset UI
        errorBanner.style.display = 'none';
        responsePreview.hidden = true;
        jsonPanel.hidden = true;
        resetMetrics();

        // Loading State
        setLoading(true);

        try {
            const response = await fetch('/api/llm', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt,
                    userId: userId || undefined,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            updateDashboard(data);

        } catch (error) {
            console.error('Error:', error);
            errorBanner.textContent = `Error: ${error.message}`;
            errorBanner.style.display = 'block';
        } finally {
            setLoading(false);
        }
    });

    function setLoading(isLoading) {
        sendButton.disabled = isLoading;
        if (isLoading) {
            sendButton.innerHTML = '<div class="spinner"></div> Sending...';
        } else {
            sendButton.innerHTML = '<span>Analyze Request</span>';
        }
    }

    function resetMetrics() {
        metricLatency.textContent = '-';
        metricTokensIn.textContent = '-';
        metricTokensOut.textContent = '-';
        metricModel.textContent = '-';
        
        qualityScoreVal.textContent = '0.0';
        qualityPill.style.visibility = 'hidden';
        
        resetBadge(badgeHallucination);
        resetBadge(badgeInjection);
        resetBadge(badgeUnsafe);
    }

    function resetBadge(el) {
        el.className = 'badge';
        el.textContent = 'n/a';
        el.style.backgroundColor = '';
        el.style.color = '';
        el.style.border = '';
    }

    function updateDashboard(data) {
        // Show Raw JSON
        rawJsonOutput.textContent = JSON.stringify(data, null, 2);
        jsonPanel.hidden = false;

        // Show Response Preview
        responseTextDisplay.textContent = data.responseText;
        responsePreview.hidden = false;

        // Update Performance Metrics
        metricLatency.textContent = data.latencyMs;
        metricTokensIn.textContent = data.tokensIn !== undefined ? data.tokensIn : 'N/A';
        metricTokensOut.textContent = data.tokensOut !== undefined ? data.tokensOut : 'N/A';
        metricModel.textContent = data.model;

        // Update Quality Score
        if (data.evaluation) {
            const score = data.evaluation.qualityScore;
            qualityScoreVal.textContent = score.toFixed(2);
            qualityPill.textContent = getQualityLabel(score);
            qualityPill.className = `quality-pill ${getQualityClass(score)}`;
            qualityPill.style.visibility = 'visible';

            // Update Safety Badges
            updateSafetyBadge(badgeHallucination, data.evaluation.hallucinationSuspected);
            updateSafetyBadge(badgeInjection, data.evaluation.promptInjectionSuspected);
            updateSafetyBadge(badgeUnsafe, data.evaluation.unsafeContentSuspected);
        }
    }

    function getQualityLabel(score) {
        if (score >= 0.8) return 'Excellent';
        if (score >= 0.5) return 'Moderate';
        return 'Poor';
    }

    function getQualityClass(score) {
        if (score >= 0.8) return 'badge-success'; // Reuse badge classes for colors
        if (score >= 0.5) return 'badge-warning';
        return 'badge-danger';
    }

    function updateSafetyBadge(element, isSuspected) {
        if (isSuspected) {
            element.textContent = 'DETECTED';
            element.className = 'badge badge-danger';
        } else {
            element.textContent = 'Clean';
            element.className = 'badge badge-success';
        }
    }
});
