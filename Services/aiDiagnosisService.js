// aiDiagnosisService.js
const { OpenAI } = require('openai');

class AIDiagnosisService {
  constructor(apiKey) {
    this.openai = new OpenAI({
      apiKey: apiKey
    });
    
    // Set model to use
    this.model = 'gpt-4';
  }

  /**
   * Analyze symptoms and generate preliminary diagnosis
   * @param {Object} symptoms - Symptom information
   * @param {String} symptoms.description - Main symptom description
   * @param {String} symptoms.duration - Duration of symptoms
   * @param {Array} symptoms.commonSymptoms - Array of common symptoms
   * @returns {Promise<Object>} Diagnosis object
   */
  async analyzeSymptoms(symptoms) {
    try {
      // Validate input
      if (!symptoms.description) {
        throw new Error('Symptom description is required');
      }

      // Format the prompt for the AI
      const prompt = this.formatDiagnosisPrompt(symptoms);
      
      // Generate completion with OpenAI
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { 
            role: "system", 
            content: "You are a medical AI assistant providing preliminary analysis of symptoms. You are not a doctor and should always recommend professional medical advice for any concerning symptoms." 
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3, // Lower temperature for more consistent results
      });

      // Parse the JSON response
      const responseContent = completion.choices[0].message.content;
      const diagnosisData = JSON.parse(responseContent);
      
      // Add metadata
      diagnosisData.timestamp = new Date().toISOString();
      diagnosisData.generated_by = `AI Model: ${this.model}`;
      
      return diagnosisData;
    } catch (error) {
      console.error('Error analyzing symptoms:', error);
      throw new Error(`Failed to analyze symptoms: ${error.message}`);
    }
  }

  /**
   * Format the prompt for AI diagnosis
   * @param {Object} symptoms - Symptom information
   * @returns {String} Formatted prompt
   */
  formatDiagnosisPrompt(symptoms) {
    const commonSymptomsText = symptoms.commonSymptoms && symptoms.commonSymptoms.length > 0 
      ? symptoms.commonSymptoms.join(', ') 
      : 'None specifically selected';
      
    return `
      You are a medical AI assistant. Based on the following symptoms, provide a preliminary diagnosis and recommendations.
      Include a clear disclaimer that this is not professional medical advice.
      
      Patient symptoms:
      - Description: ${symptoms.description}
      - Duration: ${symptoms.duration || 'Not specified'}
      - Common symptoms reported: ${commonSymptomsText}
      
      Format your response as a JSON object with the following fields:
      - condition: The possible condition (be conservative and indicate if multiple conditions are possible)
      - analysis: A detailed analysis of the symptoms and why they might indicate the condition
      - recommendations: Suggested next steps, including when to seek professional medical help
      - disclaimer: A clear medical disclaimer
      
      Do not include any diagnosis or recommendation that could be harmful. Be cautious and always suggest consulting a healthcare professional for persistent or concerning symptoms.
    `;
  }

  /**
   * Format a more detailed assessment for complex cases
   * @param {Object} symptoms - Symptom information
   * @param {Object} additionalInfo - Additional patient information
   * @returns {Promise<Object>} Detailed assessment
   */
  async detailedAssessment(symptoms, additionalInfo = {}) {
    try {
      // Create a detailed context for the AI
      const context = {
        symptoms,
        age: additionalInfo.age || 'Unknown',
        gender: additionalInfo.gender || 'Unknown',
        medicalHistory: additionalInfo.medicalHistory || 'None provided',
        medications: additionalInfo.medications || 'None provided',
        allergies: additionalInfo.allergies || 'None provided',
        lifestyleFactors: additionalInfo.lifestyleFactors || 'None provided',
      };
      
      // Format detailed prompt
      const prompt = `
        You are a medical AI assistant providing a more detailed preliminary analysis. Based on the following information, provide a more comprehensive assessment.
        This is not a substitute for professional medical advice, diagnosis, or treatment.
        
        PATIENT INFORMATION:
        - Age: ${context.age}
        - Gender: ${context.gender}
        - Medical History: ${context.medicalHistory}
        - Current Medications: ${context.medications}
        - Allergies: ${context.allergies}
        - Lifestyle Factors: ${context.lifestyleFactors}
        
        SYMPTOMS:
        - Primary Description: ${context.symptoms.description}
        - Duration: ${context.symptoms.duration || 'Not specified'}
        - Common Symptoms: ${context.symptoms.commonSymptoms?.join(', ') || 'None specified'}
        
        Please provide a detailed assessment in JSON format with the following fields:
        - possibleConditions: Array of possible conditions with confidence levels (low, medium, high)
        - analysisRationale: Detailed reasoning behind your assessment
        - differentialConsiderations: Other conditions that should be considered
        - recommendedTests: Tests that might help confirm the diagnosis
        - suggestedActions: Immediate actions and when to seek medical care
        - redFlags: Symptoms that would require immediate medical attention
        - disclaimer: Medical and legal disclaimer
        
        Be thorough but cautious. Always emphasize the importance of professional medical evaluation.
      `;
      
      // Generate completion with OpenAI
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { 
            role: "system", 
            content: "You are a medical AI assistant providing detailed preliminary analysis. You're knowledgeable but always emphasize the need for professional medical evaluation." 
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2, // Lower temperature for more consistent results
      });
      
      // Parse the JSON response
      const responseContent = completion.choices[0].message.content;
      const assessmentData = JSON.parse(responseContent);
      
      // Add metadata
      assessmentData.timestamp = new Date().toISOString();
      assessmentData.generated_by = `AI Model: ${this.model}`;
      assessmentData.assessment_type = 'detailed';
      
      return assessmentData;
    } catch (error) {
      console.error('Error generating detailed assessment:', error);
      throw new Error(`Failed to generate detailed assessment: ${error.message}`);
    }
  }

  /**
   * Generate follow-up questions based on initial symptoms
   * @param {Object} initialDiagnosis - Initial diagnosis data
   * @returns {Promise<Array>} List of follow-up questions
   */
  async generateFollowUpQuestions(initialDiagnosis) {
    try {
      const prompt = `
        Based on the following initial diagnosis, generate 3-5 important follow-up questions that would help clarify the condition or narrow down possibilities.
        
        Initial diagnosis:
        - Possible condition: ${initialDiagnosis.condition}
        - Analysis: ${initialDiagnosis.analysis}
        
        Format your response as a JSON array of questions. Each question should be specific and clinically relevant.
        These questions should help distinguish between similar conditions or assess the severity of the current condition.
      `;
      
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { 
            role: "system", 
            content: "You are a medical AI assistant generating clinically relevant follow-up questions." 
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
      });
      
      const responseContent = completion.choices[0].message.content;
      const questionsData = JSON.parse(responseContent);
      
      return questionsData.questions || [];
    } catch (error) {
      console.error('Error generating follow-up questions:', error);
      throw new Error(`Failed to generate follow-up questions: ${error.message}`);
    }
  }

  /**
   * Generate treatment recommendations based on diagnosis
   * @param {Object} diagnosis - Diagnosis data
   * @returns {Promise<Object>} Treatment recommendations
   */
  async generateTreatmentRecommendations(diagnosis) {
    try {
      const prompt = `
        Based on the following diagnosis, provide general treatment recommendations and self-care advice.
        
        Diagnosis:
        - Condition: ${diagnosis.condition}
        - Analysis: ${diagnosis.analysis}
        
        Format your response as a JSON object with the following fields:
        - selfCare: Recommendations for home care
        - overTheCounter: Potential over-the-counter medications that might help (with appropriate disclaimers)
        - lifestyle: Lifestyle modifications that might help
        - whenToSeekHelp: Clear guidelines on when to seek professional medical help
        - disclaimer: A clear medical and legal disclaimer
        
        Be specific but cautious. Do not recommend prescription medications. Always emphasize that these are general recommendations and not a substitute for professional medical advice.
      `;
      
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { 
            role: "system", 
            content: "You are a medical AI assistant providing general treatment recommendations. You are conservative in your advice and always emphasize the importance of professional medical guidance." 
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });
      
      const responseContent = completion.choices[0].message.content;
      const recommendationsData = JSON.parse(responseContent);
      
      // Add metadata
      recommendationsData.timestamp = new Date().toISOString();
      recommendationsData.based_on_condition = diagnosis.condition;
      recommendationsData.is_general_advice = true;
      
      return recommendationsData;
    } catch (error) {
      console.error('Error generating treatment recommendations:', error);
      throw new Error(`Failed to generate treatment recommendations: ${error.message}`);
    }
  }
}

module.exports = AIDiagnosisService;