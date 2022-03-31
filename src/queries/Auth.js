// eslint-disable-next-line import/prefer-default-export
export const UserSettingQuery = `
    #graphql
    query UserSettingQuery {
        settings{
            mode
            style
            navbar
            navbar_posisi
            user {
                avatar {
                    id
                }
                email
                first_name
                last_name
                role {
                    name
                }
            }

        }
    }
`;

export const LoginQuery = `
    #graphql
    mutation LoginQuery($email:String!,$password:String!){
        auth_login(email: $email, password: $password, mode: cookie) {
            access_token
            refresh_token
        }
    }
`;

export const RefreshTokenQuery = `
    #graphql
    mutation {
        auth_refresh {
            access_token
            refresh_token
        }
    }
`;