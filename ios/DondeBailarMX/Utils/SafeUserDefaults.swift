import Foundation

/// SafeUserDefaults
/// - Only writes Property List values (String/Number/Bool/Data/Date/Array/Dictionary) to UserDefaults.
/// - Provides Codable helpers (JSON -> Data).
/// - Sanitizes existing defaults early to remove non-plist values that can crash WebKit (secure coding archiver).
enum SafeUserDefaults {
  private static let defaults = UserDefaults.standard

  private static func isValidPropertyList(_ value: Any) -> Bool {
    do {
      _ = try PropertyListSerialization.data(fromPropertyList: value, format: .binary, options: 0)
      return true
    } catch {
      return false
    }
  }

  /// Set a property-list value. Returns false if rejected.
  @discardableResult
  static func setPlist(_ value: Any?, forKey key: String) -> Bool {
    guard let value else {
      defaults.removeObject(forKey: key)
      return true
    }
    guard isValidPropertyList(value) else {
      #if DEBUG
      print("[SafeUserDefaults] REJECT setPlist key=\(key) type=\(String(describing: type(of: value)))")
      #endif
      return false
    }
    defaults.set(value, forKey: key)
    return true
  }

  /// Set a Codable value as JSON Data.
  @discardableResult
  static func setCodable<T: Encodable>(_ value: T?, forKey key: String) -> Bool {
    guard let value else {
      defaults.removeObject(forKey: key)
      return true
    }
    do {
      let data = try JSONEncoder().encode(value)
      defaults.set(data, forKey: key)
      return true
    } catch {
      #if DEBUG
      print("[SafeUserDefaults] REJECT setCodable key=\(key) error=\(error)")
      #endif
      return false
    }
  }

  static func getCodable<T: Decodable>(_ type: T.Type, forKey key: String) -> T? {
    guard let data = defaults.data(forKey: key) else { return nil }
    return try? JSONDecoder().decode(type, from: data)
  }

  /// Returns a list of offenders (key, type) that are not property-list encodable.
  static func audit() -> [(key: String, type: String)] {
    let dict = defaults.dictionaryRepresentation()
    var offenders: [(String, String)] = []
    for (k, v) in dict {
      if !isValidPropertyList(v) {
        offenders.append((k, String(describing: type(of: v))))
      }
    }
    return offenders.sorted { $0.0 < $1.0 }
  }

  /// Removes keys whose values are not property-list encodable. Returns removed keys.
  @discardableResult
  static func sanitizeAll() -> [String] {
    let dict = defaults.dictionaryRepresentation()
    var removed: [String] = []
    for (k, v) in dict {
      if !isValidPropertyList(v) {
        defaults.removeObject(forKey: k)
        removed.append(k)
      }
    }
    return removed.sorted()
  }
}

