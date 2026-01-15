// src/services/api/resumeAPI.js
import apiClient from '@/services/axios.config';

export const resumeAPI = {
    /**
     * Get presigned upload URL for direct R2 upload
     * POST /resumes/upload-url
     * @param {string} fileName - File name
     * @param {string} fileType - MIME type
     * @returns {Promise<{upload_url: string, file_key: string}>}
     */
    getUploadUrl: async (fileName, fileType = 'application/pdf') => {
        const res = await apiClient.post('/resumes/upload-url', {
            file_name: fileName,
            file_type: fileType
        });
        return res; // Interceptor already unwraps .data
    },

    /**
     * Upload file directly to R2 using presigned URL
     * PUT to presigned URL
     * @param {string} presignedUrl - Presigned upload URL
     * @param {File} file - File to upload
     * @param {Function} onProgress - Progress callback
     * @returns {Promise}
     */
    uploadToR2: async (presignedUrl, file, contentType = 'application/pdf') => {
        try {
            console.log(`>> [resumeAPI] PUT to R2. Type: ${contentType}, Size: ${file.size}`);
            const response = await fetch(presignedUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': contentType
                }
            });

            if (!response.ok) {
                const text = await response.text();
                console.error(`>> [resumeAPI] R2 Upload Failed: ${response.status} ${response.statusText}`, text);
                throw new Error(`R2 Upload Failed: ${response.status} ${response.statusText} - ${text}`);
            }
            console.log(">> [resumeAPI] R2 Upload OK");
            return response;
        } catch (error) {
            console.error(">> [resumeAPI] Network Error in uploadToR2:", error);
            throw error;
        }
    },

    /**
     * Create resume record after R2 upload
     * POST /resumes
     * @param {Object} payload - Resume metadata
     * @returns {Promise} Created resume data
     */
    createResume: async (payload) => {
        const res = await apiClient.post('/resumes', payload);
        return res; // Interceptor already unwraps .data
    },

    /**
     * Get all resumes
     * GET /resumes
     * @param {boolean} activeOnly - Filter active resumes only
     * @returns {Promise} Resume list
     */
    getResumes: async () => {
        const res = await apiClient.get('/resumes');
        return res;
    },

    /**
     * Get single resume
     * GET /resumes/{resume_id}
     * @param {string} resumeId - Resume ID
     * @returns {Promise} Resume data
     */
    getResume: async (resumeId) => {
        const res = await apiClient.get(`/resumes/${resumeId}`);
        return res;
    },

    /**
     * Get presigned download URL
     * GET /resumes/{resume_id}/download-url
     * @param {string} resumeId - Resume ID
     * @returns {Promise<{download_url: string}>}
     */
    getDownloadUrl: async (resumeId) => {
        const res = await apiClient.get(`/resumes/${resumeId}/download-url`);
        return res;
    },

    /**
     * Delete a resume
     * DELETE /resumes/{resume_id}
     * @param {string} resumeId - Resume ID to delete
     * @returns {Promise}
     */
    deleteResume: async (resumeId) => {
        const res = await apiClient.delete(`/resumes/${resumeId}`);
        return res;
    },

    /**
     * Set resume as default
     * PUT /resumes/{resume_id}/default
     * @param {string} resumeId - Resume ID
     * @returns {Promise} Updated resume data
     */
    setDefaultResume: async (resumeId) => {
        const res = await apiClient.put(`/resumes/${resumeId}/default`);
        return res;
    },

    /**
     * Tailor a resume
     * POST /resumes/{resume_id}/tailor
     * @param {string} resumeId - Base Resume ID
     * @param {string} jobDescription - Job Description
     * @param {string} jobId - Optional Job ID
     * @returns {Promise} Tailored resume data
     */
    tailorResume: async (resumeId, jobDescription, jobId) => {
        const res = await apiClient.post(`/resumes/${resumeId}/tailor`, {
            job_description: jobDescription,
            job_id: jobId
        });
        return res;
    }
};

