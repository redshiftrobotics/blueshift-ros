#include <memory>
#include <string>

#include "rclcpp/rclcpp.hpp"
#include "std_msgs/msg/string.hpp"
#include "geometry_msgs/msg/twist.hpp"
#include "holonomic/holonomic.hpp"
#include "blueshift_interfaces/msg/motors.hpp"

class Control : public rclcpp::Node
{
public:
  Control()
      : Node("blueshift_control")
  {
    this->declare_parameter("holonomic_speed_limiter", 1);
    publisher_ = this->create_publisher<blueshift_interfaces::msg::Motors>("motor_speeds", 10);
    subscription_ = this->create_subscription<geometry_msgs::msg::Twist>(
        "input", 10, std::bind(&Control::topic_callback, this, std::placeholders::_1));
  }

  void respond()
  {
    this->get_parameter("holonomic_speed_limiter", holonomic_speed_limiter_parameter_);
  }

private:
  void topic_callback(const geometry_msgs::msg::Twist &msg)
  {
    RCLCPP_INFO(this->get_logger(), "I received Linear x:'%s'", std::to_string(msg.linear.x).c_str());

    respond();

    auto motor = holonomic_math(
        msg.linear.x, msg.linear.y, msg.linear.z,
        msg.angular.x, msg.angular.y, msg.angular.z,
        holonomic_speed_limiter_parameter_);

    publisher_->publish(motor);
  }

  int holonomic_speed_limiter_parameter_;
  rclcpp::Subscription<geometry_msgs::msg::Twist>::SharedPtr subscription_;
  rclcpp::Publisher<blueshift_interfaces::msg::Motors>::SharedPtr publisher_;
};

int main(int argc, char *argv[])
{
  rclcpp::init(argc, argv);
  rclcpp::spin(std::make_shared<Control>());
  rclcpp::shutdown();
  return 0;
}