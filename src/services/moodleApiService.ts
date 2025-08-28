import axios, { AxiosInstance, AxiosError, isAxiosError } from 'axios';

// Interfaces para los datos de Moodle y el plugin
interface MoodleUploadedFile {
    contextid: number;
    component: string;
    filearea: string;
    itemid: number;
    filepath: string;
    filename: string;
    url: string;
}

interface PluginImportResult {
    status: boolean;
    message: string;
    importedcount?: number;
}

interface PluginCategory {
    id: number;
    name: string;
    parent?: number;
    contextid: number;
    questioncount?: number;
}

interface PluginCreatedCategory extends PluginCategory {
    // Podría ser idéntica a PluginCategory o tener campos adicionales si el plugin los define
}

const MOODLE_API_SERVICE_LOG_PREFIX = '[MoodleApiService]';

class MoodleApiService {
    private apiClient: AxiosInstance;
    private wsToken: string;
    private moodleUrl: string;

    constructor(moodleUrl: string, wsToken: string) {
        this.wsToken = wsToken;
        this.moodleUrl = moodleUrl.replace(new RegExp('/$/'), '');
        
        this.apiClient = axios.create({
            baseURL: `${this.moodleUrl}/webservice/rest/server.php`,
            // Los parámetros comunes como wstoken y moodlewsrestformat se manejan en cada llamada
            // para mayor claridad y para facilitar el uso de URLSearchParams.
        });
        console.log(`${MOODLE_API_SERVICE_LOG_PREFIX} MoodleApiService inicializado para URL base del servidor: ${this.apiClient.defaults.baseURL}`);
    }

    private handleError(error: unknown, functionName: string): Error {
        let errorMessage = `Error en ${functionName}`;
        if (isAxiosError(error)) { // Usar la función importada directamente
            // 'error' ya es de tipo AxiosError aquí gracias a la guarda de tipo
            if (error.response && error.response.data) {
                const errorData = error.response.data as any; // Castear a any para acceso flexible
                if (errorData.exception) {
                    errorMessage = `Moodle API Error en ${functionName}: ${errorData.message} (Exception: ${errorData.exception}, Errorcode: ${errorData.errorcode})`;
                    console.error(`${MOODLE_API_SERVICE_LOG_PREFIX} ${errorMessage}`, errorData);
                } else {
                    errorMessage = `Error HTTP en ${functionName}: Status ${error.response.status} - ${JSON.stringify(errorData)}`;
                    console.error(`${MOODLE_API_SERVICE_LOG_PREFIX} ${errorMessage}`, errorData);
                }
            } else if (error.request) {
                errorMessage = `No hubo respuesta del servidor en ${functionName}. ${error.message}`;
                console.error(`${MOODLE_API_SERVICE_LOG_PREFIX} ${errorMessage}`, error.request);
            } else {
                errorMessage = `Error configurando la solicitud en ${functionName}. ${error.message}`;
                console.error(`${MOODLE_API_SERVICE_LOG_PREFIX} ${errorMessage}`);
            }
        } else if (error instanceof Error) {
            errorMessage = `Error inesperado en ${functionName}: ${error.message}`;
            console.error(`${MOODLE_API_SERVICE_LOG_PREFIX} ${errorMessage}`, error);
        } else {
            errorMessage = `Error desconocido en ${functionName}.`;
            console.error(`${MOODLE_API_SERVICE_LOG_PREFIX} ${errorMessage}`, error);
        }
        return new Error(errorMessage);
    }
    
    async uploadGiftFileToDraft(
        giftContent: string,
        filename: string,
        userIdForContext: number
    ): Promise<MoodleUploadedFile> {
        const functionName = 'core_files_upload';
        console.log(`${MOODLE_API_SERVICE_LOG_PREFIX} Iniciando ${functionName} para archivo: ${filename}, userid Moodle: ${userIdForContext}`);
        
        const params = new URLSearchParams();
        params.append('wsfunction', functionName);
        params.append('wstoken', this.wsToken);
        params.append('moodlewsrestformat', 'json');
        params.append('args[0][contextid]', userIdForContext.toString());
        params.append('args[0][component]', 'user');
        params.append('args[0][filearea]', 'draft');
        params.append('args[0][itemid]', '0');
        params.append('args[0][filepath]', '/');
        params.append('args[0][filename]', filename);
        params.append('args[0][filecontent]', Buffer.from(giftContent).toString('base64'));
        params.append('args[0][contextlevel]', 'user');
        params.append('args[0][instanceid]', userIdForContext.toString());

        try {
            const response = await this.apiClient.post<MoodleUploadedFile[] | {exception: string, message: string, errorcode: string}>('', params);

            // Verificar si la respuesta es un error de Moodle (objeto con 'exception')
            if (typeof response.data === 'object' && response.data !== null && 'exception' in response.data) {
                throw this.handleError(response.data, functionName); 
            }
            
            // Verificar si la respuesta es un array y tiene contenido (respuesta esperada para core_files_upload)
            if (Array.isArray(response.data) && response.data.length > 0) {
                const uploadedFile: MoodleUploadedFile = response.data[0];
                console.log(`${MOODLE_API_SERVICE_LOG_PREFIX} ${functionName} exitoso. Archivo subido: ${uploadedFile.filename}, itemid: ${uploadedFile.itemid}`);
                return uploadedFile;
            } 
            
            // Si no es ni un error de Moodle ni un array con datos, es una respuesta inesperada.
            console.error(`${MOODLE_API_SERVICE_LOG_PREFIX} Respuesta inesperada de ${functionName}:`, response.data);
            throw new Error(`Respuesta inesperada de Moodle API en ${functionName}`);

        } catch (error) {
            // Si el error ya fue procesado por handleError, simplemente lo relanzamos.
            // Si es un error de Axios no manejado como excepción de Moodle, handleError lo procesará.
            if (error instanceof Error && error.message.startsWith('Moodle API Error')) {
                throw error;
            }
            if (error instanceof Error && error.message.startsWith('Error HTTP')) {
                throw error;
            }
            throw this.handleError(error, `${functionName} para ${filename}`);
        }
    }

    async importQuestions(
        contextId: number,
        categoryId: number,
        filename: string,
        fileContentBase64: string
    ): Promise<PluginImportResult> {
        const functionName = 'local_opomoodletools_import_questions';
        console.log(`${MOODLE_API_SERVICE_LOG_PREFIX} Iniciando ${functionName} para categoryId: ${categoryId}, filename: ${filename}, contextId: ${contextId}`);
        
        const params = new URLSearchParams();
        params.append('wsfunction', functionName);
        params.append('wstoken', this.wsToken);
        params.append('moodlewsrestformat', 'json');
        params.append('contextid', contextId.toString());
        params.append('categoryid', categoryId.toString());
        params.append('filename', filename);
        params.append('filecontent', fileContentBase64);

        try {
            const response = await this.apiClient.post<PluginImportResult | {exception: string, message: string, errorcode: string}>('', params);

            if (typeof response.data === 'object' && response.data !== null && 'exception' in response.data) {
                 throw this.handleError(response.data, functionName);
            }
            console.log(`${MOODLE_API_SERVICE_LOG_PREFIX} ${functionName} exitoso para categoryId: ${categoryId}, filename: ${filename}. Respuesta:`, response.data);
            return response.data as PluginImportResult;
        } catch (error) {
            if (error instanceof Error && error.message.startsWith('Moodle API Error')) throw error;
            if (error instanceof Error && error.message.startsWith('Error HTTP')) throw error;
            throw this.handleError(error, `${functionName} para ${filename}`);
        }
    }

    async getQuestionCategories(contextId: number): Promise<PluginCategory[]> {
        const functionName = 'local_opomoodletools_get_question_categories';
        console.log(`${MOODLE_API_SERVICE_LOG_PREFIX} Iniciando ${functionName} para contextId: ${contextId}`);
        
        const params = new URLSearchParams();
        params.append('wsfunction', functionName);
        params.append('wstoken', this.wsToken);
        params.append('moodlewsrestformat', 'json');
        params.append('contextid', contextId.toString());

        try {
            // Forzar el uso de POST, ya que Moodle a menudo espera parámetros en el cuerpo para WS
            const response = await this.apiClient.post<PluginCategory[] | {exception: string, message: string, errorcode: string}>('', params);
            
            if (typeof response.data === 'object' && response.data !== null && 'exception' in response.data) {
                throw this.handleError(response.data, functionName);
            }
            console.log(`${MOODLE_API_SERVICE_LOG_PREFIX} ${functionName} exitoso para contextId: ${contextId}. ${(response.data && (response.data as PluginCategory[]).length) || 0} categorías encontradas.`);
            return response.data as PluginCategory[];
        } catch (error) {
             if (error instanceof Error && error.message.startsWith('Moodle API Error')) throw error;
             if (error instanceof Error && error.message.startsWith('Error HTTP')) throw error;
             throw this.handleError(error, `${functionName} para contextId ${contextId}`);
        }
    }

    async createQuestionCategory(
        contextId: number,
        name: string,
        parentId: number = 0
    ): Promise<PluginCreatedCategory> {
        const functionName = 'local_opomoodletools_create_question_category';
        console.log(`${MOODLE_API_SERVICE_LOG_PREFIX} Iniciando ${functionName} para nombre: ${name}, contextId: ${contextId}, parentId: ${parentId}`);

        const params = new URLSearchParams();
        params.append('wsfunction', functionName);
        params.append('wstoken', this.wsToken);
        params.append('moodlewsrestformat', 'json');
        params.append('contextid', contextId.toString());
        params.append('name', name);
        params.append('parentid', parentId.toString());
        
        try {
            const response = await this.apiClient.post<PluginCreatedCategory | {exception: string, message: string, errorcode: string}>('', params);

            if (typeof response.data === 'object' && response.data !== null && 'exception' in response.data) {
                throw this.handleError(response.data, functionName);
            }
            console.log(`${MOODLE_API_SERVICE_LOG_PREFIX} ${functionName} exitoso. Categoría creada:`, response.data);
            return response.data as PluginCreatedCategory;
        } catch (error) {
            if (error instanceof Error && error.message.startsWith('Moodle API Error')) throw error;
            if (error instanceof Error && error.message.startsWith('Error HTTP')) throw error;
            throw this.handleError(error, `${functionName} para ${name}`);
        }
    }
}

export default MoodleApiService; 