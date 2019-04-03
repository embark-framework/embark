import React from 'react';
import {Row, Col, Card, CardHeader, CardBody} from 'reactstrap';
import {Link} from 'react-router-dom';
import PropTypes from 'prop-types';
import Pagination from './Pagination';

import CardTitleIdenticon from './CardTitleIdenticon';

const Accounts = ({accounts, changePage, currentPage, numberOfPages}) => (
  <Row>
    <Col>
      <Card>
        <CardHeader>
          <h2>Accounts</h2>
        </CardHeader>
        <CardBody>
          {!accounts.length && "No accounts to display"}
          {accounts.map(account => (
            <div className="explorer-row border-top" key={account.address}>
              <CardTitleIdenticon id={account.address}>Account&nbsp;
                <Link to={`/explorer/accounts/${account.address}`}>{account.address}</Link>
              </CardTitleIdenticon>
              <Row>
                <Col>
                  <strong>Balance</strong>
                  <div>{account.balance} Ether</div>
                </Col>
                <Col>
                  <strong>Tx Count</strong>
                  <div>{account.transactionCount}</div>
                </Col>
                <Col>
                  <strong>Index</strong>
                  <div>{account.index}</div>
                </Col>
              </Row>
            </div>
          ))}
          {numberOfPages > 1 && <Pagination changePage={changePage} currentPage={currentPage} numberOfPages={numberOfPages}/>}
        </CardBody>
      </Card>
    </Col>
  </Row>
);

Accounts.propTypes = {
  accounts: PropTypes.arrayOf(PropTypes.object),
  changePage: PropTypes.func,
  currentPage: PropTypes.number,
  numberOfPages: PropTypes.number
};

export default Accounts;
