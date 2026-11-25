package stpim.util;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/** 時刻は、すべて日本時間で扱う */
public final class Clock {

    public static final ZoneId ZONE = ZoneId.of("Asia/Tokyo");
    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm");

    private Clock() {
    }

    public static LocalDateTime now() {
        return LocalDateTime.now(ZONE);
    }

    public static LocalDate today() {
        return LocalDate.now(ZONE);
    }

    public static String formatTime(LocalDateTime value) {
        return value == null ? "—" : TIME_FORMAT.format(value);
    }
}
