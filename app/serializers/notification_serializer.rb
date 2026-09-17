module NotificationSerializer
  module_function

  def item(n)
    time = n.time_label.presence || Api::Params.iso(n.created_at)
    {
      id: n.id, title: n.title, message: n.message, time: time, timeLabel: time,
      icon: n.icon, iconColor: n.icon_color, bgColor: n.bg_color, unread: n.unread,
      userId: n.user_id, adminId: n.admin_id, companyId: n.company_id,
      createdAt: Api::Params.iso(n.created_at), updatedAt: Api::Params.iso(n.updated_at)
    }
  end

  def compact(n)
    {
      id: n.id, title: n.title, message: n.message,
      time: n.time_label.presence || Api::Params.iso(n.created_at),
      icon: n.icon, iconColor: n.icon_color, bgColor: n.bg_color, unread: n.unread,
      createdAt: Api::Params.iso(n.created_at), updatedAt: Api::Params.iso(n.updated_at)
    }
  end

  def agency(n)
    {
      id: n.id, title: n.title, message: n.message,
      time: n.time_label.presence || Api::Params.iso(n.created_at),
      icon: n.icon, iconColor: n.icon_color, bgColor: n.bg_color, unread: n.unread
    }
  end
end
