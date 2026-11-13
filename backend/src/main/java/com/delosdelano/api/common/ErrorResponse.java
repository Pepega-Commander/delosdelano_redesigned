package com.delosdelano.api.common;

import org.springframework.http.HttpStatusCode;

/** Public error contract. Never copy exception messages or rejected values into it. */
public record ErrorResponse(int status, String message) {
    public static ErrorResponse forStatus(HttpStatusCode status) {
        String message = switch (status.value()) {
            case 400 -> "Некорректные данные запроса";
            case 401 -> "Неверная почта или пароль";
            case 403 -> "Доступ запрещён";
            case 409 -> "Email уже зарегистрирован";
            default -> "Не удалось выполнить запрос";
        };
        return new ErrorResponse(status.value(), message);
    }
}
