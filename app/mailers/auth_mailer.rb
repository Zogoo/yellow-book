# Transactional auth mail. OTP codes are also written to the log in
# non-production so local sign-in works without an inbox.
class AuthMailer < ApplicationMailer
  def self.deliver_otp(email, code, expires_at)
    Rails.logger.info("[OTP] Email: #{email} -> Code: #{code} (expires #{expires_at.iso8601})") unless Rails.env.production?
    otp(email, code, expires_at).deliver_later
  end

  def self.deliver_password_reset(email, reset_url, expires_at)
    Rails.logger.info("[PasswordReset] Email: #{email} -> #{reset_url}") unless Rails.env.production?
    password_reset(email, reset_url, expires_at).deliver_later
  end

  def otp(email, code, expires_at)
    @code = code
    @expires_at = expires_at
    mail(to: email, subject: "Your Yellow Book verification code")
  end

  def password_reset(email, reset_url, expires_at)
    @reset_url = reset_url
    @expires_at = expires_at
    mail(to: email, subject: "Reset your Yellow Book password")
  end

  def welcome(email, name)
    @name = name
    mail(to: email, subject: "Welcome to Yellow Book!")
  end

  def company_approved(email, company_name)
    @company_name = company_name
    mail(to: email, subject: %(Your company "#{company_name}" has been approved!))
  end
end
