export type AstIdentifier = {
    type: 'Identifier'
    column: boolean
    name: string
    location: [number, number]
}

export type AstArrayExpression = {
    type: 'ArrayExpression'
    elements: AstNode[]
    location: [number, number]
}

export type AstObjectExpression = {
    type: 'ObjectExpression'
    properties: {
        key: string
        value: AstNode
    }[]
    location: [number, number]
}

export type AstBinaryExpression = {
    type: 'BinaryExpression'
    operator: string
    left: AstNode
    right: AstNode
    location: [number, number]
}

export type AstCallExpression = {
    type: 'CallExpression'
    arguments: AstNode[]
    callee: string
    location: [number, number]
}

export type AstMemberExpression = {
    type: 'MemberExpression'
    object: AstNode
    property: AstNode
    location: [number, number]
}

export type AstUnaryExpression = {
    type: 'UnaryExpression'
    operator: string
    argument: AstNode
    location: [number, number]
}

export type AstNumber = {
    type: 'Number'
    value: number | 'NaN' | 'Infinity'
    location: [number, number]
}

export type AstBoolean = {
    type: 'Boolean'
    value: boolean
    location: [number, number]
}

export type AstString = {
    type: 'String'
    value: string
    location: [number, number]
}

export type AstDate = {
    type: 'Date'
    value: string
    location: [number, number]
}

export type AstNull = {
    type: 'Null'
    location: [number, number]
}

export type AstNode = AstIdentifier
    | AstArrayExpression
    | AstObjectExpression
    | AstBinaryExpression
    | AstCallExpression
    | AstMemberExpression
    | AstUnaryExpression
    | AstNumber
    | AstBoolean
    | AstString
    | AstDate
    | AstNull

export type ExpressionAst = {
    version: number
    code: string
    source: null | AstNode
    error: null | {
        message: string
        character: number
    }
}