import { useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Alert } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { register, clearError } from '../store/authSlice';

const { Title, Text } = Typography;
interface RegisterForm {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
}
function Register() {
    const [form] = Form.useForm();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { loading, error } = useAppSelector(state => state.auth);

    useEffect(() => {
        return () => {
            dispatch(clearError());
        }
    }, [dispatch]);

    const onFinish = async (values: RegisterForm) => {
        try {
            await dispatch(register(values)).unwrap();
            navigate('/profile');
        } catch (err) {
            console.error("Login failed:", error);
        }
    }


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
                <Title level={2} style={{ marginBottom: 0, fontSize: '52px', fontWeight: 650 }}>Đăng ký</Title>
            </div>
            <Card style={{
                width: 400,
                maxWidth: '90vw',
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
                    name="register"
                    layout="vertical"
                    onFinish={onFinish}
                    autoComplete="off"
                    requiredMark={false}

                >
                    <Form.Item
                        label={<span style={{ fontSize: '16px', fontWeight: 500, color: '#333' }}>Họ và tên</span>}
                        name="name"
                        rules={[
                            { required: true, message: 'Vui lòng nhập họ và tên!' },
                            { min: 2, message: 'Họ và tên phải có ít nhất 2 ký tự!' }
                        ]}
                        style={{ marginBottom: 24, marginTop: 10 }}
                    >
                        <Input
                            placeholder="Họ và tên"
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
                        label={<span style={{ fontSize: '16px', fontWeight: 500, color: '#333' }}>Email</span>}
                        name="email"
                        rules={[
                            { required: true, message: 'Vui lòng nhập email!' },
                            { type: 'email', message: 'Email không hợp lệ!' }
                        ]}
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
                            { required: true, message: 'Vui lòng nhập mật khẩu!' },
                            {
                                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/, message: 'Mật khẩu phải tổi thiểu 8 ký tự, ít nhất một chữ cái viết hoa, một chữ cái viết thường và một số!'
                            }
                        ]}
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

                    <Form.Item
                        label={<span style={{ fontSize: '16px', fontWeight: 500, color: '#333' }}>Xác nhận mật khẩu</span>}
                        name="confirmPassword"
                        dependencies={['password']}
                        rules={[
                            { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('password') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password
                            placeholder="Xác nhận mật khẩu"
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

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            loading={loading}
                            block
                        >
                            Đăng ký
                        </Button>
                    </Form.Item>
                </Form>

                <div style={{ textAlign: 'center' }}>
                    <Text>
                        Đã có tài khoản?{' '}
                        <Link to="/login">Đăng nhập</Link>
                    </Text>
                </div>
            </Card>
        </div>
    )
}

export default Register