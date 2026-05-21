
import { BadRequestError } from 'passport-headerapikey';
import * as CryptoJS from 'crypto-js';
import { Observable } from 'rxjs';
import { BadRequestException, HttpException, HttpStatus, InternalServerErrorException } from '@nestjs/common';


export const Helper = {
    IsNullOrEmpty(input: any): boolean {
        return (
            input === null || input === 'null' || input === undefined || input === '' || input.length === 0
        );
    },

    IsSuccessfulStatusCode(status: HttpStatus): boolean {
        return (
            status >= 200 && status <= 299
        );
    },

    updateRequestHeaders(
        request: Request,
        property: string,
        value: string,
    ): void {
        if (!request.headers.hasOwnProperty(property) || property === 'Content-Type') {
            request.headers[property] = value;
        } else {
            void 0;
        }
    },

    getPaginator(
        page: number,
        size: number,
        length: number,
    ): any {
        return {
            size: size,
            page: page,
            lastPage: Math.max(Math.ceil(length / size), 1),
            startIndex: page * size,
            endIndex: Math.min(size * (page + 1), length),
            length
        }
    },

    getGraphQlSelectFields(
        info: any,
        deep: number,
        entityName: string,
    ): string[] {

        let selectFields: string[] = [];

        if (deep === 0) {
            selectFields = (info.fieldNodes[0].selectionSet.selections.map(
                (item) => item.name.value as string,
            )) as string[];
        } else {

            for (const iterator of info.fieldNodes[0].selectionSet.selections) {

                if (iterator.name.value === entityName) {
                    selectFields = (iterator.selectionSet.selections.map(
                        (item) => item.name.value as string,
                    )) as string[];
                }

            }
        }

        return selectFields;
    },

    throwCachedError(error: any) {
        // Re-lanzar HttpException tal cual (incluye subclases: BadRequest, NotFound, etc.)
        if (error instanceof HttpException) {
            throw error;
        }
        // QueryFailedError (Postgres) -> mapear a 400/409 según código SQL
        if (error && typeof error === 'object' && error.name === 'QueryFailedError') {
            try {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const { handlePostgresError } = require('../../errors/postgres-error-handler');
                throw handlePostgresError(error);
            } catch (mapped) {
                if (mapped instanceof HttpException) throw mapped;
            }
        }
        // Errores de dominio lanzados con `throw new Error('CODE_NNN: ...')` -> 400
        if (error instanceof Error && /^[A-Z][A-Z0-9_]*_\d+:/.test(error.message || '')) {
            throw new BadRequestException(error.message);
        }
        // Fallback
        throw new InternalServerErrorException(error);
    },

    async waitObservableSubscription(
        response: Observable<any>,
    ): Promise<any> {
        let result: any = null;
        const subscribe = response.subscribe((x) => {
            result = x;
        });
        while (!result) {
            await new Promise((resolve) => {
                setTimeout(resolve, 500);
            });
        }
        subscribe.unsubscribe();

        return result;
    },

    getBirthday(idNumber: string): Date | null {
        // Si no se tiene el número de identidad del client devolver null
        if (Helper.IsNullOrEmpty(idNumber)) return null;

        // Calcular fecha de nacimiento
        const year = idNumber.substring(0, 2);
        const month = idNumber.substring(2, 4);
        const day = idNumber.substring(4, 6);

        // Devolver fecha
        return new Date(+year, +month - 1, +day);
    },


    getAge(birthday: Date, currentDate: Date): number {

        // Si la fecha de nacimiento es null devolver 0
        if (Helper.IsNullOrEmpty(birthday)) return 0;

        const edad = currentDate.getFullYear() - birthday.getFullYear();

        // Comprueba si ya ha pasado el cumpleaños de este año
        if (
            currentDate.getMonth() < birthday.getMonth() ||
            (currentDate.getMonth() === birthday.getMonth() &&
                currentDate.getDate() < birthday.getDate())
        ) {
            // Si no ha pasado, resta 1 año a la edad
            return edad - 1;
        }

        return edad;
    },

    currentDate(): { day: number; month: number; year: number; hours: number } {
        const date = new Date();
        return { day: date.getDate(), month: date.getMonth() + 1, year: date.getFullYear(), hours: date.getHours() };
    },

    secretPhraseBase64(initializationVectorToFrontEnd: string): string {
        const date = Helper.currentDate();
        const secretPhraseBase64 = Helper.stringToBase64(`${date.day > 9 ? date.day : '0' + date.day}${date.month > 9 ? date.month : '0' + date.month}${initializationVectorToFrontEnd}${date.year}`);
        return secretPhraseBase64;
    },


    stringToBase64(value: string): string {
        const words = CryptoJS.enc.Utf8.parse(value);
        const base64 = CryptoJS.enc.Base64.stringify(words);
        return base64;
    },

    /**
    * Encrypt
    */
    aesEncrypt(data: any, secretPhrase: string, initializationVector: string): string {

        const dataString = JSON.stringify(data);

        // Secret params
        const _key = CryptoJS.enc.Base64.parse(secretPhrase);
        const _iv = CryptoJS.enc.Base64.parse(initializationVector);

        // Decrypt data
        const dataEncrypted = CryptoJS.AES.encrypt(
            dataString, _key, {
            iv: _iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        }).toString();

        return dataEncrypted;
    },


    /**
    * Decrypt
    */
    aesDecrypt(encryptedDataString: string, secretPhrase: string, initializationVector: string): any {

        // Secret params
        const _key = CryptoJS.enc.Base64.parse(secretPhrase);
        const _iv = CryptoJS.enc.Base64.parse(initializationVector);

        // Decrypt data
        const dataDecrypted = CryptoJS.AES.decrypt(
            encryptedDataString, _key, {
            iv: _iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        }).toString(CryptoJS.enc.Utf8);

        // Convert the string data to a un objeto
        const data = JSON.parse(dataDecrypted);

        return data;
    },

    generateRandomCode() {
        return Math.round(Math.random() * 999999).toString().padStart(6, '0');
    },

    transformImageSize(imageUrl, width) {
        // Verificar que la URL sea válida y contenga el segmento '/upload/'
        if (!imageUrl.includes('/upload/')) {
            throw new Error("La URL no contiene el segmento '/upload/' necesario para modificar el tamaño.");
        }

        // Insertar el segmento para el cambio de tamaño después de '/upload/'
        const modifiedUrl = imageUrl.replace(
            '/upload/',
            `/upload/c_scale,w_${width}/`
        );

        return modifiedUrl;
    }

};

export const imageFileFilter = (req, file, callback) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|PNG|webp|svg)$/)) {
        return callback(
            new BadRequestException('Este formato de imagen no está permitida!'),
            false,
        );
    }
    callback(null, true);
};

