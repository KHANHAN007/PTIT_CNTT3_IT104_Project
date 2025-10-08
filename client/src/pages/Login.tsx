// ...existing code...
import { useEffect } from 'react'
import { Alert, Button, Card, Form, Input, Typography } from "antd";
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { Link, useNavigate } from 'react-router-dom';
import { clearError, login } from "../store/authSlice";

const { Title, Text } = Typography;
interface LoginForm {
    email: string;
    password: string;
}
function Login() {
    const user = useAppSelector(state => state.auth.user);
    const [form] = Form.useForm();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { loading, error } = useAppSelector(state => state.auth);

    useEffect(() => {
        if (user && user.id) {
            navigate('/profile', { replace: true });
        }
    }, [user, navigate]);
    useEffect(() => {
        return () => {
            dispatch(clearError());
        }
    }, [dispatch]);

    const onFinish = async (values: LoginForm) => {
        try {
            await dispatch(login(values)).unwrap();
            navigate('/profile');
        } catch (error) {
            console.error("Login failed:", error);
        }
    };
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: '#f0f2f5',
        }}>
            <div style={{ textAlign: 'center', marginBottom: 25 }}>
                <Title level={2} style={{ marginBottom: 0, fontSize: '52px', fontWeight: 650 }}>Đăng nhập</Title>
            </div>
            <Card style={{
                width: 400,
                maxWidth: '90vw',
                // padding: '30px 30px',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid #e8e8e8'
            }}>

                {error && (
                    <Alert
                        message={error}
                        type="error"
                        showIcon
                        closable
                        onClose={() => dispatch(clearError())}
                        style={{ marginBottom: 16 }}
                    />
                )}

                <Form
                    form={form}
                    name="login"
                    layout="vertical"
                    onFinish={onFinish}
                    autoComplete="off"
                    requiredMark={false}
                >
                    <Form.Item
                        label={<span style={{ fontSize: '16px', fontWeight: 500, color: '#333' }}>Email</span>}
                        name="email"
                        rules={[
                            { required: true, message: 'Vui lòng nhập email!' },
                            { type: 'email', message: 'Email không hợp lệ!' }
                        ]}
                        style={{ marginBottom: 24, marginTop: 10 }}
                    >
                        <Input
                            placeholder="Địa chỉ email"
                            size="large"
                            style={{
                                textAlign: 'center',
                                height: '50px',
                                borderRadius: '8px',
                                fontSize: '16px',
                                border: '2px solid #e8e8e8'
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        label={<span style={{ fontSize: '16px', fontWeight: 500, color: '#333' }}>Mật khẩu</span>}
                        name="password"
                        rules={[
                            { required: true, message: 'Vui lòng nhập mật khẩu!' }
                        ]}
                        style={{ marginBottom: 32 }}
                    >
                        <Input.Password
                            placeholder="Mật khẩu"
                            size="large"
                            style={{
                                height: '50px',
                                borderRadius: '8px',
                                fontSize: '16px',
                                border: '2px solid #e8e8e8'
                            }}
                            styles={{
                                input: {
                                    textAlign: 'center'
                                }
                            }}
                        />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 24 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            loading={loading}
                            block
                            style={{
                                height: '50px',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: 600,
                                background: '#1677ff',
                                border: 'none'
                            }}
                        >
                            Đăng nhập
                        </Button>
                    </Form.Item>
                </Form>

                <div style={{ textAlign: 'center', marginTop: 20 }}>
                    <Text style={{ color: '#666', fontSize: '14px' }}>
                        Chưa có tài khoản?{' '}
                        <Link to="/register" style={{ color: '#1677ff', textDecoration: 'none', fontWeight: 500 }}>Đăng ký</Link>
                    </Text>
                </div>
            </Card>
        </div>
    )
}

export default Login