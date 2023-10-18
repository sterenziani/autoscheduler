import { useTranslation } from 'react-i18next';
import { Button, Modal } from 'react-bootstrap';
import ReactRouterPrompt from "react-router-prompt";

// This component shows an alert if the user leaves the page while props.when is true
function LeavePagePrompt(props) {
    const {t} = useTranslation()

    return (
        <ReactRouterPrompt when={props.when}>
            {({ isActive, onConfirm, onCancel }) => {
                return(
                    <Modal show={isActive} className="text-black">
                        <Modal.Header closeButton>
                            <Modal.Title>{t('forms.changesNotSaved')}</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <p>{t('forms.areYouSureLeave')}</p>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="grey" onClick={onCancel}>
                                {t('forms.cancel')}
                            </Button>
                            <Button variant="danger" onClick={onConfirm}>
                                {t('forms.leave')}
                            </Button>
                        </Modal.Footer>
                    </Modal>
                )
            }
        }
        </ReactRouterPrompt>
    )
}

export default LeavePagePrompt;
