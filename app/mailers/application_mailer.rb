class ApplicationMailer < ActionMailer::Base
  # The sender has to be an address the mail provider has verified, so it is
  # configuration rather than a constant. The default only suits development.
  default from: ENV.fetch("MAILER_FROM", "no-reply@yellowbook.local")
end
