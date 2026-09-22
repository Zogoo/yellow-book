module Api
  # Cyrillic-safe text handling. SQLite folds ASCII only, so we fold in Ruby and
  # compare against a stored folded copy.
  module Text
    module_function

    def fold(value)
      utf8(value).unicode_normalize(:nfkc).downcase.strip
    end

    # Mongolian Cyrillic to Latin, so a company called "Гоо Урлан" still gets a
    # readable, linkable slug instead of an empty one.
    TRANSLITERATION = {
      "а" => "a", "б" => "b", "в" => "v", "г" => "g", "д" => "d", "е" => "ye", "ё" => "yo",
      "ж" => "j", "з" => "z", "и" => "i", "й" => "i", "к" => "k", "л" => "l", "м" => "m",
      "н" => "n", "о" => "o", "ө" => "o", "п" => "p", "р" => "r", "с" => "s", "т" => "t",
      "у" => "u", "ү" => "u", "ф" => "f", "х" => "kh", "ц" => "ts", "ч" => "ch", "ш" => "sh",
      "щ" => "sch", "ъ" => "", "ы" => "y", "ь" => "i", "э" => "e", "ю" => "yu", "я" => "ya"
    }.freeze

    def transliterate(value)
      fold(value).chars.map { |char| TRANSLITERATION.fetch(char, char) }.join
    end

    def slugify(value)
      transliterate(value).gsub(/[^a-z0-9]+/, "-").gsub(/\A-+|-+\z/, "")
    end

    def searchable(*parts)
      fold(parts.flatten.compact.join(" ").squeeze(" "))
    end

    # Input can arrive tagged as binary (uploads, odd clients); never raise on it.
    def utf8(value)
      string = value.to_s
      return string if string.encoding == Encoding::UTF_8 && string.valid_encoding?

      string.dup.force_encoding(Encoding::UTF_8).scrub("")
    end
  end
end
